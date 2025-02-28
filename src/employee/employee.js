export { addEmployeeDataToDB, employeeForm, fulfillFormFromDoc }
import { collection, doc, setDoc } from "firebase/firestore"
import { clearInputField, clearWitheSpacesInData, getAllById, addChange, addClick } from "../custom_functions"
import { collectionName } from "../script"

// ---> tworzysz listę nazw tylko raz. gdy chcesz rozszerzyć listę wystarczy dopisać nowy tylko tutaj
const employeeDomElementsIds = {
    employeeForm: "employee-form",
    avatar: {
        label: "avatar-label",
        inputField: "input-avatar",
    },
    personalData: {
        inputFieldName: "input-name",
        inputFieldSurname: "input-surname",
        inputFieldBirthDate: "input-birth-date",
        inputFieldEmail: "input-email",
        inputFieldPhoneNumber: "input-phone-number",
    },
    experience: {
        container: "experience-container",
        addBtn: "add-experience-btn",
    },
    skills: {
        inputField: "input-skill",
        addBtn: "add-skill-btn",
        container: "skills-container",
    },
    links: {
        inputField: "input-link",
        addBtn: "add-link-btn",
        container: "links-container",
    },
}

// ---> automatycznie stworzy się lista elementów dom
const employeeDomElements = getAllById(employeeDomElementsIds)
console.log('%c employeeDomElements:', 'background: #ffcc00; color: #003300', employeeDomElements)

const employeeForm = document.getElementById("employee-form")

/* Employee avatar */
const avatarLabelEl = document.getElementById("avatar-label")
const inputFieldAvatarEl = document.getElementById("input-avatar")

/* Employee personal data*/
const inputFieldNameEl = document.getElementById("input-name")
const inputFieldSurnameEl = document.getElementById("input-surname")
const inputFieldBirthDateEl = document.getElementById("input-birth-date")
const inputFieldEmailEl = document.getElementById("input-email")
const inputFieldPhoneNumberEl = document.getElementById("input-phone-number")

/* Employee experience */
const experienceContainer = document.getElementById("experience-container")
const addExperienceBtn = document.getElementById("add-experience-btn")

/* Employee skills */
const inputFieldSkillEl = document.getElementById("input-skill")
const addSkillBtn = document.getElementById("add-skill-btn")
const skillsContainerEl = document.getElementById("skills-container")

/* Employee links */
const inputFieldLinkEl = document.getElementById("input-link")
const addLinkBtn = document.getElementById("add-link-btn")
const linksContainerEl = document.getElementById("links-container")

const saveEmployeeDataBtn = document.getElementById("save-employee-data-btn")


/* Event listeners */
inputFieldAvatarEl.addEventListener("change", changeLabelAvatar)
addExperienceBtn.addEventListener("click", addExperienceToExperienceContainer)
addSkillBtn.addEventListener("click", addSkillToSkillsContainer)
addLinkBtn.addEventListener("click", addLinkToLinksContainer)

// addChange(employeeDomElements.avatar.inputField, changeLabelAvatar)
// addClick(employeeDomElements.experience.addBtn, addExperienceToExperienceContainer)
// addClick(employeeDomElements.skills.addBtn, addSkillToSkillsContainer)
// addClick(employeeDomElements.links.addBtn, addLinkToLinksContainer)


/* DB operations */
async function addEmployeeDataToDB(db, userId) {
    const employeeRef = collection(db, collectionName)
    const docRef = doc(employeeRef, userId)

    const ImageURL = createURLFromImageFile()

    const result = {}
    const pd = employeeDomElementsIds.personalData
    const setNames = ['name', 'surname', 'birthDate', 'email', 'phoneNumber']

    Object.keys(pd).forEach((key, i) => {
        const itemName = setNames[i]
        const value = pd[key].value
        result[itemName] = itemName === 'birthDate' ? value : clearWitheSpacesInData(value)
    })



    // const nameValue = clearWitheSpacesInData(inputFieldNameEl.value)
    // const surnameValue = clearWitheSpacesInData(inputFieldSurnameEl.value)
    // const birthDateValue = inputFieldBirthDateEl.value
    // const emailValue = clearWitheSpacesInData(inputFieldEmailEl.value)
    // const phoneNumberValue = clearWitheSpacesInData(inputFieldPhoneNumberEl.value)

    const experienceArray = createArrayFromExperience()
    const skillsArray = createArrayFromSkills()
    const linksArray = createArrayFromLinks()

    await setDoc(docRef, {
        avatar: ImageURL,
        // name: nameValue,
        // surname: surnameValue,
        // birthDate: birthDateValue,
        // email: emailValue,
        // phoneNumber: phoneNumberValue,
        experience: experienceArray,
        skills: skillsArray,
        links: linksArray
    })
    console.log("Doc created")
}

/* Filling form form doc */

function fulfillFormFromDoc(docSnapData) {

    setAvatarFromDoc(docSnapData["avatar"])

    setHeaderInputsFromDocSnapData(docSnapData)

    setExperienceInputsFromDocSnapData(docSnapData["experience"])

    setSkillFromDocSnapData(docSnapData["skills"])

    setLinksFromDocSnapData(docSnapData["links"])

}

function setAvatarFromDoc(avatar) {
    const imageEl = document.createElement("img")
    const imageSource = avatar.replace("blob:", "")

    imageEl.src = imageSource

    avatarLabelEl.textContent = ""
    avatarLabelEl.appendChild(imageEl)
}

function setHeaderInputsFromDocSnapData(docSnapData) {
    inputFieldNameEl.value = docSnapData["name"]
    inputFieldSurnameEl.value = docSnapData["surname"]
    inputFieldBirthDateEl.value = docSnapData["birthDate"]
    inputFieldEmailEl.value = docSnapData["email"]
    inputFieldPhoneNumberEl.value = docSnapData["phoneNumber"]
}

function setExperienceInputsFromDocSnapData(experience) {
    for (let i = 1; i < experience.length; i++) {
        addExperienceToExperienceContainer()
    }

    for (let i = 0; i < experienceContainer.children.length; i++) {
        ["jobTitle", "companyName", "startDate", "endDate", "jobDescription"].forEach((e, j) => {
            experienceContainer.children[i].children[j].value = experience[i][e]
        })
    }
}

function setSkillFromDocSnapData(skills) {
    for (let el of skills) {
        const skillEl = createSkillEl(el)

        skillsContainerEl.appendChild(skillEl)
    }
}

function setLinksFromDocSnapData(links) {
    for (let el of links) {
        const linkContainerEl = createLinkContainerEl(el)

        linksContainerEl.appendChild(linkContainerEl)
    }
}


/* Form management */

function changeLabelAvatar() {
    const imageEl = document.createElement("img")
    const imageSource = URL.createObjectURL(inputFieldAvatarEl.files[0])

    imageEl.src = imageSource

    avatarLabelEl.textContent = ""
    avatarLabelEl.appendChild(imageEl)
}

function addExperienceToExperienceContainer() {
    const experienceBoxEl = document.createElement("div")

    experienceBoxEl.classList.add("experience")

    const jobTitleInputField = document.createElement("input")
    const companyNameInputField = document.createElement("input")
    const startDateInputField = document.createElement("input")
    const endDateInputField = document.createElement("input")
    const jobDescriptionInputField = document.createElement("input")

    jobTitleInputField.classList.add("input-field")

    companyNameInputField.classList.add("input-field")

    startDateInputField.classList.add("input-field")
    startDateInputField.setAttribute("type", "date")

    endDateInputField.classList.add("input-field")
    endDateInputField.setAttribute("type", "date")

    jobDescriptionInputField.classList.add("input-field")

    experienceBoxEl.appendChild(jobTitleInputField)
    experienceBoxEl.appendChild(companyNameInputField)
    experienceBoxEl.appendChild(startDateInputField)
    experienceBoxEl.appendChild(endDateInputField)
    experienceBoxEl.appendChild(jobDescriptionInputField)

    experienceContainer.appendChild(experienceBoxEl)

}

function addSkillToSkillsContainer() {
    let inputValue = inputFieldSkillEl.value

    if (inputValue) {
        inputValue = clearWitheSpacesInData(inputValue)

        const skillEl = createSkillEl(inputValue)

        skillsContainerEl.appendChild(skillEl)

        clearInputField(inputFieldSkillEl)
    }
}

function addLinkToLinksContainer() {
    let inputValue = inputFieldLinkEl.value

    if (inputValue) {
        inputValue = clearWitheSpacesInData(inputValue)
        const linkContainerEl = createLinkContainerEl(inputValue)

        linksContainerEl.appendChild(linkContainerEl)

        clearInputField(inputFieldLinkEl)
    }
}

/* Custom functions */

function createArrayFromExperience() {
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

function createArrayFromSkills() {
    const skillElsArray = skillsContainerEl.children
    const skillsArray = []
    for (let el of skillElsArray) {
        skillsArray.push(el.textContent)
    }
    return skillsArray
}

function createArrayFromLinks() {
    const linkElsArray = linksContainerEl.children
    const linksArray = []
    for (let el of linkElsArray) {
        linksArray.push(el.textContent)
    }
    return linksArray
}

function createURLFromImageFile() {
    // console.log(inputFieldAvatarEl.files[0])
    const ImageURL = URL.createObjectURL(inputFieldAvatarEl.files[0])
    if (ImageURL) {
        return ImageURL
    }
}

function createSkillEl(value) {
    const skillEl = document.createElement("p")

    skillEl.textContent = value

    skillEl.addEventListener("dblclick", (event) => {
        event.target.remove()
    })

    return skillEl
}

function createLinkContainerEl(value) {
    const linkContainer = document.createElement("div")
    const linkEl = document.createElement("a")
    const deleteLinkBtn = document.createElement("input")

    linkContainer.classList.add("link-container")

    linkEl.href = value
    linkEl.textContent = value
    linkEl.target = "_blank"

    deleteLinkBtn.classList.add("btn")
    deleteLinkBtn.classList.add("btn-delete")
    deleteLinkBtn.type = "button"
    deleteLinkBtn.value = "X"

    deleteLinkBtn.addEventListener("dblclick", (event) => {
        event.target.parentElement.remove()
    })

    linkContainer.appendChild(linkEl)
    linkContainer.appendChild(deleteLinkBtn)
    return linkContainer
}