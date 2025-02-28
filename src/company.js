import { collection, query, where, getDocs } from "firebase/firestore"
import { collectionName, db } from "./script"

const selectSkillsSearchEl = document.getElementById("select-skills")
const searchBtn = document.getElementById("search-btn")
const resultsContainer = document.getElementById("results-search")

searchBtn.addEventListener("click", searchEmployeesInDB)


async function searchEmployeesInDB() {
    const q = query(collection(db, collectionName), where("skills", "in", selectSkillsSearchEl.value))

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const userBox = document.createElement("div")
        const avatar = document.createElement("img")
        const userDataBox = document.createElement("div")
    })
}