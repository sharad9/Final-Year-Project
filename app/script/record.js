
import { db, ref, get, set } from "../script/fbmodule.js";
let inputSize = 512
let scoreThreshold = 0.5

let labeledDescriptors = null
let faceMatcher = null

function getCurrentFaceDetectionNet() {
  return faceapi.nets.tinyFaceDetector
}

function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getFaceDetectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

function hasEnrollmentData() {


  return true;
}

window.clearAttendance = function clearAttendance() {
  db.set('attendance', []).write()
}

function clearUsers() {
  db.set('enrollment', []).write()
  location.href = '../html/enroll.html'
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


// somehow 'descriptors' property is converted to object after saved to lowdb
// e.g {0: 10, 1: 20, 2: 30} instead of [10, 20, 30]




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
  userDetails = userDetails.value.split(' ');
  var className = userDetails[0], rollNo = userDetails[1];
  const studentRef = ref(db, `enrollment/${className}/${rollNo}/`);
  get(studentRef).then((snapshot) => {
    if (snapshot.exists()) {
      var usersData = snapshot.val();
      console.log(usersData.name)
      labeledDescriptors = Array(usersData).map(function (ld) { return { label: ld.name, descriptors: ld.descriptors.map(function (d) { return Object.values(d) }) } });
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

  const userDetails = e.detail
  const time = Date();
  var long, lat;
  const success = (pos) => {
    var crd = pos.coords;
    long = crd.longitude;
    lat = crd.latitude;
    addNewUser(userDetails, time);
    new PNotify({
      type: 'success',
      text: userDetails + ' is here!'
    })

  }
  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  if (navigator.geolocation) {
    //navigator.geolocation.watchPosition(showPosition);
    navigator.geolocation.watchPosition(success, error, options);
  } else {
    alert('location is not supported');
  }



  var options = {
    enableHighAccuracy: true,
    maximumAge: 0
  };



  function addNewUser(userDetails, time) {
    userDetails = userDetails.split(' ');
    var className = userDetails[0], rollNo = userDetails[1];
    set(ref(db, `attendance/${className}/${rollNo}/`), {
      time: time,
      latitude: lat,
      longitude: long,

    })
      .then(() => {

        // location.href = '../html/index.html'
      })
      .catch((error) => {
        alert('Data not inserted' + error);
      });


  }






  //write data ===========>attendance







})



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