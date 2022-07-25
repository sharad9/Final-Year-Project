
import { db, ref, get, set } from "../script/fbmodule.js";
let inputSize = 512
let scoreThreshold = 0.5

let labeledDescriptors = null
let faceMatcher = null;
let recorded = false;
let eventDispatched = false;

function getCurrentFaceDetectionNet() {
  return faceapi.nets.tinyFaceDetector
}

function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getFaceDetectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}



window.clearAttendance = function clearAttendance() {
  db.set('attendance', []).write()
}



window.enrollUser = function enrollUser() {
  Swal.fire({
    title: 'Enroll New Face',
    text: "Please be ready in front of camera. You would need to make some face expressions to enroll. Do not worry, we do not share your data.",
    icon: 'info',
    showCancelButton: true,
    // confirmButtonColor: '#3085d6',
    // cancelButtonColor: '#d33',
    confirmButtonText: "I am Ready"
  }).then((result) => {
    if (result.value) {
      location.href = '../html/enroll.html'
    }
  })
}



document.getElementById('mark').addEventListener('click', markAttendance, true);

async function markAttendance() {
  var userDetails = await Swal.fire({
    input: 'text',
    inputPlaceholder: 'Enter Ex: CSE3 153',
    allowOutsideClick: false,
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!'
      }
    }
  });

  console.log(userDetails);
  userDetails = userDetails.value.toUpperCase().split(' ');
  var className = userDetails[0], rollNo = userDetails[1];
  const studentRef = ref(db, `enrollment/${className}/${rollNo}/`);
  get(studentRef).then((snapshot) => {
    if (snapshot.exists()) {
      var usersData = snapshot.val();
      console.log(usersData.name)
      labeledDescriptors = Array(usersData).map(function (ld) { return { label: className + ' ' + rollNo, descriptors: ld.descriptors.map(function (d) { return Object.values(d) }) } });
      console.log(labeledDescriptors)

      faceMatcher = faceapi.FaceMatcher.fromJSON({
        distanceThreshold: 0.6, // not sure what is this for
        labeledDescriptors: labeledDescriptors
      })

    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  });



}


document.addEventListener('attendance_detected', (e) => {

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }
  var options = {
    enableHighAccuracy: true,
    maximumAge: 0
  };



  const userDetails = e.detail
  const time = Date();

  const success = (pos) => {
    var crd = pos.coords;
    var long = crd.longitude;
    var lat = crd.latitude;


    addNewUser(userDetails, time, lat, long);



  }
  if (navigator.geolocation) {
    //navigator.geolocation.watchPosition(showPosition);
    navigator.geolocation.watchPosition(success, error, options);
  } else {
    alert('location is not supported');
  }
}
);





function addNewUser(userDetails, time, lat, long) {
  recorded = true;
  userDetails = userDetails.split(' ');
  var className = userDetails[0]; var rollNo = userDetails[1]; var distance = userDetails[2];

  var tlat = 0; var tlong = 0;
  get(ref(db, `attendance/${className}/${0}/`)).then((snapshot) => {
    if (snapshot.exists() && rollNo != "0") {
      var tData = snapshot.val();
      tlat = tData.latitude;
      tlong = tData.longitude;
      var distance = Math.round(getDistanceFromLatLonInKm(tlat, tlong, lat, long) * 100) / 100;
      userDetails = userDetails + ' ' + distance * 1000;
      set(ref(db, `attendance/${className}/${rollNo}/`), {
        time: time,
        latitude: lat,
        longitude: long,
        distance: distance

      })
        .then(() => {

          Swal.fire({
            title: 'You are marked',
            text: "Thank You",
            icon: 'info',
            // confirmButtonColor: '#3085d6',
            // cancelButtonColor: '#d33',
            confirmButtonText: "I confirm "
          }).then(() => {
            location.href = '../html/index.html';
          });
          //alert('Data is inserted');
          // 
        })
        .catch((error) => {
          alert('Data not inserted' + error);
        });


    } else {

      set(ref(db, `attendance/${className}/${rollNo}/`), {
        time: time,
        latitude: lat,
        longitude: long,
        distance: '0'

      })
        .then(() => {

          Swal.fire({
            title: 'You are marked',
            text: "Thank You",
            icon: 'info',
            // confirmButtonColor: '#3085d6',
            // cancelButtonColor: '#d33',
            confirmButtonText: "I confirm "
          }).then(() => {
            location.href = '../html/index.html';
          });
        })
        .catch((error) => {
          alert('Data not inserted' + error);
        });
    }
  }).catch((error) => {
    console.error(error);
  });



}








function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in kilometers
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in KM
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}




window.onPlay = async function onPlay() {
  const videoEl = $('#inputVideo').get(0)

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())

  const options = getFaceDetectorOptions()

  const results = await faceapi.detectAllFaces(videoEl, options).withFaceLandmarks().withFaceDescriptors();

  const canvas = $('#overlay').get(0)

  if (results) {

    const dims = faceapi.matchDimensions(canvas, videoEl, true)

    const resizedResults = faceapi.resizeResults(results, dims)

    resizedResults.forEach(({ detection, descriptor }) => {

      let label = 'unknown'
      let boxColor = 'red'

      if (faceMatcher !== null) {
        label = faceMatcher.findBestMatch(descriptor).label
        if (label !== 'unknown') {
          boxColor = 'green'
          
            document.dispatchEvent(new CustomEvent('attendance_detected', { detail: label }))
            
          
        }
      }

      // draw detection box
      const options = { label, boxColor }
      const drawBox = new faceapi.draw.DrawBox(detection.box, options)
      drawBox.draw(canvas)
    })

  } else {
    // clear drawings when no detection
    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  setTimeout(() => onPlay())
}

async function run() {
  // load face detection and face expression recognition models
  if (!isFaceDetectionModelLoaded()) {
    await getCurrentFaceDetectionNet().load('../html/models')
  }
  await faceapi.loadFaceLandmarkModel('../html/models')
  await faceapi.loadFaceRecognitionModel('../html/models')

  // try to access users webcam and stream the images
  // to the video element
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  const videoEl = $('#inputVideo').get(0)
  videoEl.srcObject = stream
}

$(document).ready(function () {
  run()
})