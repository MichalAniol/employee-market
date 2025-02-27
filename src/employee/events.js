import { addClick, addChange } from "./utils.js"
import { dom } from "./employee.js"

const changeLabelAvatar = () => {
    const imageEl = document.createElement("img")
    const imageSource = URL.createObjectURL(dom.inputFieldAvatarEl.files[0])

    imageEl.src = imageSource

    dom.avatarLabelEl.textContent = ""
    dom.avatarLabelEl.appendChild(imageEl)
}

const addExperienceToExperienceContainer = () => {
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

    dom.experienceContainer.appendChild(experienceBoxEl)
}


const addSkillToSkillsContainer = () => {
    let inputValue = dom.inputFieldSkillEl.value

    if (inputValue) {
        inputValue = clearWitheSpacesInData(inputValue)

        const skillEl = document.createElement("p")

        skillEl.textContent = inputValue

        dom.skillsContainer.appendChild(skillEl)

        clearInputField(dom.inputFieldSkillEl)
    }
}

const addLinkToLinksContainer = () => {
    const inputValue = dom.inputFieldLinkEl.value

    if (inputValue) {
        const linkEl = document.createElement("a")

        linkEl.href = dom.inputFieldLinkEl.value
        linkEl.textContent = dom.inputFieldLinkEl.value
        linkEl.target = "_blank"

        dom.linksContainerEl.appendChild(linkEl)

        clearInputField(dom.inputFieldLinkEl)
    }
}

/* Event listeners */
addChange(dom.inputFieldAvatarEl, changeLabelAvatar)
addClick(dom.addExperienceBtn, addExperienceToExperienceContainer)
addClick(dom.addSkillBtn, addSkillToSkillsContainer)
addClick(dom.addLinkBtn, addLinkToLinksContainer)