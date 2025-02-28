export { addEmployeeDataToDB, employeeForm, fulfillFormFromDoc }
import { collection, doc, setDoc } from "firebase/firestore"
import { clearInputField, clearWitheSpacesInData, getAllById, addChange, addClick } from "../custom_functions"
import { collectionName } from "../script"

// ---> tworzysz listę nazw tylko raz. gdy chcesz rozszerzyć listę wystarczy dopisać nowy tylko tutaj
const employeeDomElementsIds = {
    form: "employee-form",
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

const personalDataNames = ['name', 'surname', 'birthDate', 'email', 'phoneNumber']
const experienceContainerDataNames = ["jobTitle", "companyName", "startDate", "endDate", "jobDescription"]
const experienceContainerDataTypes = [null, null, 'date', 'date', null]

// ---> automatycznie stworzy się lista elementów dom
const employeeDomElements = getAllById(employeeDomElementsIds)
console.log('%c employeeDomElements:', 'background: #ffcc00; color: #003300', employeeDomElements)

// const employeeForm = document.getElementById("employee-form")

// /* Employee avatar */
// const avatarLabelEl = document.getElementById("avatar-label")
// const inputFieldAvatarEl = document.getElementById("input-avatar")

// /* Employee personal data*/
// const inputFieldNameEl = document.getElementById("input-name")
// const inputFieldSurnameEl = document.getElementById("input-surname")
// const inputFieldBirthDateEl = document.getElementById("input-birth-date")
// const inputFieldEmailEl = document.getElementById("input-email")
// const inputFieldPhoneNumberEl = document.getElementById("input-phone-number")

// /* Employee experience */
// const experienceContainer = document.getElementById("experience-container")
// const addExperienceBtn = document.getElementById("add-experience-btn")

// /* Employee skills */
// const inputFieldSkillEl = document.getElementById("input-skill")
// const addSkillBtn = document.getElementById("add-skill-btn")
// const skillsContainerEl = document.getElementById("skills-container")

// /* Employee links */
// const inputFieldLinkEl = document.getElementById("input-link")
// const addLinkBtn = document.getElementById("add-link-btn")
// const linksContainerEl = document.getElementById("links-container")

// const saveEmployeeDataBtn = document.getElementById("save-employee-data-btn")


/* Event listeners */
// inputFieldAvatarEl.addEventListener("change", changeLabelAvatar)
// addExperienceBtn.addEventListener("click", addExperienceToExperienceContainer)
// addSkillBtn.addEventListener("click", addSkillToSkillsContainer)
// addLinkBtn.addEventListener("click", addLinkToLinksContainer)

addChange(employeeDomElements.avatar.inputField, changeLabelAvatar)
addClick(employeeDomElements.experience.addBtn, addExperienceToExperienceContainer)
addClick(employeeDomElements.skills.addBtn, addSkillToSkillsContainer)
addClick(employeeDomElements.links.addBtn, addLinkToLinksContainer)

/* DB operations */
async function addEmployeeDataToDB(db, userId) {
    const employeeRef = collection(db, collectionName)
    const docRef = doc(employeeRef, userId)

    const ImageURL = createURLFromImageFile()

    const result = {}
    const pd = employeeDomElementsIds.personalData

    Object.keys(pd).forEach((key, i) => {
        const itemName = personalDataNames[i]
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

    employeeDomElements.avatar.label.textContent = ""
    employeeDomElements.avatar.label.appendChild(imageEl)
}

function setHeaderInputsFromDocSnapData(docSnapData) {
    employeeDomElements.personalData.forEach((e, i) => e.value = docSnapData[personalDataNames[i]])
    // inputFieldNameEl.value = docSnapData["name"]
    // inputFieldSurnameEl.value = docSnapData["surname"]
    // inputFieldBirthDateEl.value = docSnapData["birthDate"]
    // inputFieldEmailEl.value = docSnapData["email"]
    // inputFieldPhoneNumberEl.value = docSnapData["phoneNumber"]
}

function setExperienceInputsFromDocSnapData(experience) {
    for (let i = 1; i < experience.length; i++) {
        addExperienceToExperienceContainer()
    }

    for (let i = 0; i < employeeDomElementsIds.experience.container.children.length; i++) {
        experienceContainerDataNames.forEach((e, j) => {
            employeeDomElementsIds.experience.container.children[i].children[j].value = experience[i][e]
        })
    }
}

function setSkillFromDocSnapData(skills) {
    for (let el of skills) {
        const skillEl = createSkillEl(el)

        employeeDomElementsIds.skills.container.appendChild(skillEl)
    }
}

function setLinksFromDocSnapData(links) {
    for (let el of links) {
        const linkContainerEl = createLinkContainerEl(el)

        employeeDomElementsIds.links.container.appendChild(linkContainerEl)
    }
}


/* Form management */

function changeLabelAvatar() {
    const imageEl = document.createElement("img")
    const imageSource = URL.createObjectURL(employeeDomElements.avatar.inputField.files[0])

    imageEl.src = imageSource

    employeeDomElements.avatar.label.textContent = ""
    employeeDomElements.avatar.label.appendChild(imageEl)
}

function addExperienceToExperienceContainer() {
    const experienceBoxEl = document.createElement("div")

    experienceBoxEl.classList.add("experience")

    const domElements = {}
    experienceContainerDataNames.forEach(e => domElements[e] = document.createElement("input"))
    // const jobTitleInputField = document.createElement("input")
    // const companyNameInputField = document.createElement("input")
    // const startDateInputField = document.createElement("input")
    // const endDateInputField = document.createElement("input")
    // const jobDescriptionInputField = document.createElement("input")

    domElements.forEach((e, i) => {
        e.classList.add("input-field")
        const type = experienceContainerDataTypes[i]
        if (type !== null) e.setAttribute("type", type)
    })
    // jobTitleInputField.classList.add("input-field")
    // companyNameInputField.classList.add("input-field")
    // startDateInputField.classList.add("input-field")
    // startDateInputField.setAttribute("type", "date")
    // endDateInputField.classList.add("input-field")
    // endDateInputField.setAttribute("type", "date")
    // jobDescriptionInputField.classList.add("input-field")

    domElements.forEach(e => experienceBoxEl.appendChild(e))
    // experienceBoxEl.appendChild(jobTitleInputField)
    // experienceBoxEl.appendChild(companyNameInputField)
    // experienceBoxEl.appendChild(startDateInputField)
    // experienceBoxEl.appendChild(endDateInputField)
    // experienceBoxEl.appendChild(jobDescriptionInputField)

    employeeDomElementsIds.experience.container.appendChild(experienceBoxEl)
}

function addSkillToSkillsContainer() {
    let inputValue = employeeDomElementsIds.skills.inputField.value

    if (inputValue) {
        inputValue = clearWitheSpacesInData(inputValue)

        const skillEl = createSkillEl(inputValue)

        employeeDomElementsIds.skills.container.appendChild(skillEl)

        clearInputField(employeeDomElementsIds.skills.inputField)
    }
}

function addLinkToLinksContainer() {
    let inputValue = employeeDomElementsIds.links.inputField.value

    if (inputValue) {
        inputValue = clearWitheSpacesInData(inputValue)
        const linkContainerEl = createLinkContainerEl(inputValue)

        employeeDomElementsIds.links.container.appendChild(linkContainerEl)

        clearInputField(employeeDomElementsIds.links.inputField)
    }
}

/* Custom functions */

function createArrayFromExperience() {
    const experienceArray = document.getElementsByClassName("experience")
    let newExperienceArray = []

    const dataNames = ["jobTitle", "companyName", "startDate", "endDate", "jobDescription"]

    for (let experience of experienceArray) {

        const result = {}
        dataNames.forEach((n, i) => result[n] = experience.children[i]?.value)
        // const jobTitle = experience.children[0]
        // const companyName = experience.children[1]
        // const startDate = experience.children[2]
        // const endDate = experience.children[3]
        // const jobDescription = experience.children[4]

        newExperienceArray.push(result)
        // newExperienceArray.push({
        //     "jobTitle": jobTitle.value,
        //     "companyName": companyName.value,
        //     "startDate": startDate.value,
        //     "endDate": endDate.value,
        //     "jobDescription": jobDescription.value
        // })
    }
    return newExperienceArray
}

function createArrayFromSkills() {
    const skillElsArray = employeeDomElementsIds.skills.container.children
    const skillsArray = []
    for (let el of skillElsArray) {
        skillsArray.push(el.textContent)
    }
    return skillsArray
}

function createArrayFromLinks() {
    const linkElsArray = employeeDomElementsIds.links.container.children
    const linksArray = []
    for (let el of linkElsArray) {
        linksArray.push(el.textContent)
    }
    return linksArray
}

function createURLFromImageFile() {
    // console.log(inputFieldAvatarEl.files[0])
    const ImageURL = URL.createObjectURL(employeeDomElements.avatar.inputField.files[0])
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