export const get = id => document.getElementById(id)

export const addClick =(elem, func)=> (elem.addEventListener("click", func))
export const addChange =(elem, func)=> (elem.addEventListener("change", func))