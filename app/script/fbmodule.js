// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.3.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,updateProfile} from "https://www.gstatic.com/firebasejs/9.3.0/firebase-auth.js";
import { getDatabase, ref, set, onValue ,get} from "https://www.gstatic.com/firebasejs/9.3.0/firebase-database.js";


import { getStorage,ref as sRef ,uploadBytesResumable ,getDownloadURL} from "https://www.gstatic.com/firebasejs/9.3.0/firebase-storage.js";

// Create a root reference

const firebaseConfig = {
	apiKey: "AIzaSyAXhKfzA1SfQLmmtHIsukY8IOkmZT6eKKg",
	authDomain: "sharad123.firebaseapp.com",
	databaseURL: "https://sharad123-default-rtdb.firebaseio.com",
	projectId: "sharad123",
	storageBucket: "sharad123.appspot.com",
	messagingSenderId: "663353173833",
	appId: "1:663353173833:web:d326ef026a7e45c51e1c98"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getDatabase();
const storage = getStorage();


export { app, analytics,auth,db,ref,sRef, set,get, onValue,createUserWithEmailAndPassword, onAuthStateChanged,
	 signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,updateProfile,
	 storage ,uploadBytesResumable,getDownloadURL};
