import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { getFirestore, collection, doc, getDoc } from "firebase/firestore"
import { addEmployeeDataToDB, employeeForm, fulfillFormFromDoc } from "./employee/employee.js"
import { get } from "./utils.js"

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.API_KEY,
    authDomain: import.meta.env.AUTH_DOMAIN,
    projectId: import.meta.env.PROJECT_ID,
    storageBucket: import.meta.env.STORAGE_BUCKET,
    messagingSenderId: import.meta.env.MESSAGING_SENDER_ID,
    appId: import.meta.env.APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth()
const google_provider = new GoogleAuthProvider()
const db = getFirestore(app)

const collectionName = "employees"

const dom = {
    loggedInView: get("logged-in-view"),
    loggedOutView: get("logged-out-view"),
    signInWithGoogleBtn: get("sign-in-google-btn"),
    signOutBtn: get("sign-out-btn"),
}

dom.signInWithGoogleBtn.addEventListener("click", logInViaGoogle)
dom.signOutBtn.addEventListener("click", signOutFromApp)

/* Auth section */

onAuthStateChanged(auth, (user) => {
    if (user) {
        // getDocFromDB(user.uid).then((docSnapData) => {
        //     fulfillFormFromDoc(docSnapData)
        // })
        // .catch((error) => {
        //     console.error(error.message)
        // })

        employeeForm.addEventListener("submit", (event) => {
            event.preventDefault()
            addEmployeeDataToDB(db, user.uid)
        })
        showLoggedInView()
    }
    else {
        showLoggedOutView()
    }
})

const signOutFromApp = () => {
    signOut(auth)
        .then(() => {
        })
        .catch((error) => {
            console.error(error.message)
        })
}

const logInViaGoogle = () => {
    signInWithPopup(auth, google_provider)
        .then(() => {
        })
        .catch((error) => {
            console.error(error.message)
        })
}

const getDocFromDB = async (userId) => {
    const employeeRef = collection(db, collectionName)
    const docRef = doc(employeeRef, userId)

    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
        return docSnap.data()
    }
    else {
        console.log("Doc does not exists.")
    }
}


/* Custom functions */

const showLoggedInView = () => {
    hideView(dom.loggedOutView)
    showView(dom.loggedInView)
}

const showLoggedOutView = () => {
    hideView(dom.loggedInView)
    showView(dom.loggedOutView)
}

const showView = (view) => view.style.display = "block"
const hideView = (view) => view.style.display = "none"

