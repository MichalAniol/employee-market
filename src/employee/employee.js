export { addEmployeeDataToDB, employeeForm, fulfillFormFromDoc }
import { collection, doc, setDoc } from "firebase/firestore"
import { clearInputField, clearWitheSpacesInData } from "../custom_functions"
import { get } from "./utils.js"

const collectionName = "employees"

export const dom = {
    employeeForm: get("employee-form"),

    /* Employee avatar */
    avatarLabelEl: get("avatar-label"),
    inputFieldAvatarEl: get("input-avatar"),

    /* Employee personal data*/
    inputFieldNameEl: get("input-name"),
    inputFieldSurnameEl: get("input-surname"),
    inputFieldBirthDateEl: get("input-birth-date"),
    inputFieldEmailEl: get("input-email"),
    inputFieldPhoneNumberEl: get("input-phone-number"),

    /* Employee experience */
    experienceContainer: get("experience-container"),
    addExperienceBtn: get("add-experience-btn"),

    /* Employee skills */
    inputFieldSkillEl: get("input-skill"),
    addSkillBtn: get("add-skill-btn"),
    skillsContainer: get("skills-container"),

    /* Employee links */
    inputFieldLinkEl: get("input-link"),
    addLinkBtn: get("add-link-btn"),
    linksContainerEl: get("links-container"),
}

/* DB operations */
const addEmployeeDataToDB = async (db, userId) => {
    const employeeRef = collection(db, collectionName)
    const docRef = doc(employeeRef, userId)

    const nameValue = clearWitheSpacesInData(dom.inputFieldNameEl.value)
    const surnameValue = clearWitheSpacesInData(dom.inputFieldSurnameEl.value)
    const birthDateValue = dom.inputFieldBirthDateEl.value
    const emailValue = clearWitheSpacesInData(dom.inputFieldEmailEl.value)
    const phoneNumberValue = clearWitheSpacesInData(dom.inputFieldPhoneNumberEl.value)

    const experienceArray = createArrayFromExperience()
    const skillsArray = createArrayFromSkills()
    const ImageURL = createURLFromImageFile()

    await setDoc(docRef, {
        avatar: ImageURL,
        name: nameValue,
        surname: surnameValue,
        birthDate: birthDateValue,
        email: emailValue,
        phoneNumber: phoneNumberValue,
        experience: experienceArray,
        skills: skillsArray
    })
    console.log("Doc created")
}

/* Form management */

const fulfillFormFromDoc = (docSnapData) => {
    console.log(docSnapData)

    setAvatarFromDoc(docSnapData["avatar"])

    // inputFieldAvatarEl.files[0] = 
}

const setAvatarFromDoc(avatar =) => {

    fetch(avatar).then((response) => {
        return response.blob()
    }).then((myBlob) => {
        const imageEl = document.createElement("img")
        const imageSource = URL.createObjectURL(myBlob)
        imageEl.src = imageSource

        dom.avatarLabelEl.textContent = ""
        dom.avatarLabelEl.appendChild(imageEl)
    })

    // const imageEl = document.createElement("img")
    // const imageSource = URL.createObjectURL(avatar)

    // imageEl.src = imageSource

    // avatarLabelEl.textContent = ""
    // avatarLabelEl.appendChild(imageEl)
}

/* Custom functions */

const createArrayFromExperience = () => {
    const experienceArray = document.getElementsByClassName("experience")
    let newExperienceArray = []

    for (let experience of experienceArray) {
        const jobTitle = experience.children[0]
        const companyName = experience.children[1]
        const startDate = experience.children[2]
        const endDate = experience.children[3]
        const jobDescription = experience.children[4]

        newExperienceArray.push({
            "jobTitle": jobTitle.value,
            "companyName": companyName.value,
            "startDate": startDate.value,
            "endDate": endDate.value,
            "jobDescription": jobDescription.value
        })
    }
    return newExperienceArray
}

const createArrayFromSkills = () => {
    const skillsElsArray = dom.skillsContainer.children
    const skillsArray = []
    for (let el of skillsElsArray) {
        skillsArray.push(el.textContent)
    }
    return skillsArray
}

const createURLFromImageFile = () => {
    console.log(dom.inputFieldAvatarEl.files[0])
    // const ImageURL = URL.createObjectURL(inputFieldAvatarEl.files[0])
    // if (ImageURL) {
    //     return ImageURL
    // }
}

