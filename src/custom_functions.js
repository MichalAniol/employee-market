// ---> tak można zapisac to prościej
// ---> exporty dajesz zawsze na końcu pliku, albo tak jak tu, przed obiektem exportowanym
export const clearInputField = (element) => element.value = ""

export const clearWitheSpacesInData = (data) => data.trim()

// ---> ideałem jest jeśli wywołania document.getElementById uzywasz tylko raz w kodzie
// ---> i budujesz funkcje iterujace przy pomocy takie funkcji
const getById = elem => document.getElementById(elem)

// ---> rekurencyjne iterowanie po elementach obiektu budując najpierw listę kluczy obiektu
export const getAllById = (obj) => {
    const result = {}
    Object.keys(obj).forEach(key => {
        const elem = obj[key]
        if (typeof elem === "string") {
            result[key] = getById(elem)
        }
        if (typeof elem === 'object' && elem !== null) {
            result[key] = getAllById(elem)
        }
    })
    return result
}

export const addChange = (elem, fn) => elem.addEventListener("change", fn)

export const addClick = (elem, fn) => elem.addEventListener("click", fn)