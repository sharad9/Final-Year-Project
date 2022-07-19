import { db, ref,set} from "../script/fbmodule.js";

	let inputSize = 512
	let scoreThreshold = 0.5

	let objExpressionDescriptors = {}
	const available_expressions = ['happy']

	function getCurrentFaceDetectionNet() {
	    return faceapi.nets.tinyFaceDetector
	}

	function isFaceDetectionModelLoaded() {
	  return !!getCurrentFaceDetectionNet().params
	}

	function getFaceDetectorOptions() {
	  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
	}
	
	function hasAllExpressions() {
		return available_expressions.every(function(expression) {
			return objExpressionDescriptors.hasOwnProperty(expression)
		})
    }

    document.addEventListener('expression_added', (e) => {
      
		$('#emotion-'+ e.detail).addClass('fulfilled')

		if (hasAllExpressions()) 
			document.dispatchEvent(new CustomEvent('expressions_fulfilled', {detail: Object.values(objExpressionDescriptors)}))
    });

    document.addEventListener('expressions_fulfilled', (e) => {

      (async () => {

      	const { value: userDetails } = await Swal.fire({
    		  input: 'text',
    		  inputPlaceholder: 'Enter Ex: CSE3 153 SHARAD',
    		  allowOutsideClick: false,
    		  inputValidator: (value) => {
    		    if (!value) {
    		      return 'You need to write something!'
    		    }
    		  }
    		})

  	addNewUser(userDetails, e.detail)

  		


  		})()
    });

    
function enrolledUser() {
  Swal.fire({
    title: 'You Got Enrolled',
    text: "Thank You",
    icon: 'info',
    // confirmButtonColor: '#3085d6',
    // cancelButtonColor: '#d33',
    confirmButtonText: "I confirm "
  }).then((result) => {
    if (result.value) {
      location.href = '../html/index.html'
    }
  }).catch((error) => {
    alert('Data not inserted' + error);
  });
}

 function addNewUser(userDetails, descriptors) {
userDetails = userDetails.split(' ');
  var className = userDetails[0], rollNo = userDetails[1], name = userDetails[2]
   set(ref(db, `enrollment/${className}/${rollNo}/`), {
    name: name,
    descriptors: descriptors
    
  })
    .then(() => {
       
      enrolledUser();

 		
    })
 
}
  
    	
    

   window.onPlay =  async function onPlay() {
      const videoEl = $('#inputVideo').get(0)

      if(videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
        return setTimeout(() => onPlay())


      const options = getFaceDetectorOptions()

      const result = await faceapi.detectSingleFace(videoEl, options)
        .withFaceLandmarks().withFaceExpressions().withFaceDescriptor()

      const canvas = $('#overlay').get(0)
      
      if (result) {
        const dims = faceapi.matchDimensions(canvas, videoEl, true)

        const resizedResult = faceapi.resizeResults(result, dims)
        const minConfidence = 0.8

        Object.keys(resizedResult.expressions).forEach( key => {
        	// skip if other expresssions
         	if (available_expressions.indexOf(key) < 0) return
        	
         	if (resizedResult.expressions[key] > minConfidence)
         		// check if face expression not fulfilled yet 
            	if (!objExpressionDescriptors.hasOwnProperty(key)) {
            		// update fullfilled face expressions
            		objExpressionDescriptors[key] = resizedResult.descriptor
            		// trigger event each new expression detected
            		document.dispatchEvent(new CustomEvent('expression_added', {detail: key}))
            	}
        })
        // default label
        const label = 'new user'
        const options = { label: label, drawLines: false}
        const drawBox = new faceapi.draw.DrawBox(resizedResult.detection.box, options)
        drawBox.draw(canvas)
      } else {
        // clear drawings when no detection
        const context = canvas.getContext('2d')

        context.clearRect(0, 0, canvas.width, canvas.height)
      }

      setTimeout(() => onPlay())
    }
// variable function


// or anonymous function
// variable function

    async function run() {
      // load face detection and face expression recognition models
      if (!isFaceDetectionModelLoaded()) {
        await getCurrentFaceDetectionNet().load('../html/models')
      }
      await faceapi.loadFaceExpressionModel('../html/models')
      await faceapi.loadFaceLandmarkModel('../html/models')
      await faceapi.loadFaceRecognitionModel('../html/models')

      // try to access users webcam and stream the images
      // to the video element
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
      const videoEl = $('#inputVideo').get(0)
      videoEl.srcObject = stream
    }




    $(document).ready(function() {
      run()
    })