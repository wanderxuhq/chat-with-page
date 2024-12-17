import { isProbablyReaderable, Readability } from "@mozilla/readability"
import OpenAI from "openai"

import { kmeans } from "./kmeans"

console.log("content")
const findMainDOM = (el: Element) => {
  //const children = el.childNodes;
  const children = Array.from(el.childNodes).filter(
    (e) => e.nodeType === Node.ELEMENT_NODE
  ) as Element[]
  if (children.length === 1) {
    return findMainDOM(children[0])
  } else {
    //let myArray = Array.from(nl)
    let size = 0
    for (const child of children) {
      //console.log(child)
      const rect = child.getBoundingClientRect()
      size += rect.width * rect.height
    }

    for (const child of children) {
      const rect = child.getBoundingClientRect()
      if ((rect.width * rect.height) / size > 0.4) {
        return findMainDOM(child)
      }
    }

    return el
  }
}

let nodes = new Map()
const kChildren = (el: Element) => {
  const children = (
    Array.from(el.childNodes).filter(
      (e) => e.nodeType === Node.ELEMENT_NODE
    ) as Element[]
  ).filter(
    (e) =>
      //TODO do some reafctor
      e.getBoundingClientRect().width > 0 &&
      e.getBoundingClientRect().height > 0
  )

  const dataSet = []

  const names = new Map()

  const classNames = []
  for (const child of children) {
    const tClassNames =
      child.className.trim() !== "" &&
      child.className
        .trim()
        .split(" ")
        .map((e) => e.trim())
    if (tClassNames) {
      for (const className of tClassNames) {
        if (!names.has(className)) {
          names.set(className, Math.random() * 100)
        }
      }
    }
  }

  for (const child of children) {
    const classNames =
      child.className.trim() !== "" &&
      child.className
        .trim()
        .split(" ")
        .map((e) => e.trim())
    const data = []

    for (const className of names.keys()) {
      if (classNames && classNames.find((e) => e === className)) {
        data.push(names.get(className))
      } else {
        data.push(0)
      }
    }

    if (data.filter((e) => e !== 0).length > 0) {
      dataSet.push(data)
      nodes.set(data, child)
    }
  }
  return dataSet
}

const similar = (el1, el2) => {
  let score = 0

  score += el1.nodeName === el2.nodeName ? 1 : 0

  const rect1 = el1.getBoundingClientRect()
  const rect2 = el2.getBoundingClientRect()
  score += el1.width === el2.width ? 10 : 0
  score += el1.height === el2.height ? 10 : 0

  const class1 =
    el1.className.trim() !== "" &&
    el1.className
      .trim()
      .split(" ")
      .forEach((e) => e.trim())
  const class2 =
    el2.className.trim() !== "" &&
    el2.className
      .trim()
      .split(" ")
      .forEach((e) => e.trim())
  if (class1 && class2) {
    for (const c1 of class1) {
      for (const c2 of class1) {
        if (c1 === c2) {
          score++
        }
      }
    }
  }

  return score > 1
}

findMainDOM(document.body)

export { findMainDOM }
export {}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("content msg", msg)
  // If the received message has the expected format...
  // Call the specified callback, passing
  // the web-page's DOM content as argument
  if (msg.start) {
    (async () => {
      console.log("content in")
      //if (isProbablyReaderable(document)) {
      console.log("isProbablyReaderable", true)
      const documentClone: Document = document.cloneNode(true) as Document
      const article = new Readability(documentClone, {
        keepClasses: true
      }).parse()
      console.log("article", article)
      //console.log("article.textContent", article.textContent.substring(0, 1000))

      //console.log(findMainDOM(document.body));
      //extractContent(findMainDOM(document.body))
      content.push(current)
      console.log(content)
      const response = await chrome.runtime.sendMessage({ content: article.textContent })
      sendResponse(response)

      return
    })()

    return true
  }
  return false;
})

const content = []
let current = {
  title: null,
  content: "",
  dom: null
}
const extractContent = (dom: Element) => {
  for (let node of dom.childNodes) {
    if (node.nodeType === 3) {
      current.content += node.textContent
    } else {
      const element = node as Element
      if (element.tagName === "P") {
        current.content += element.textContent
      } else if (
        element.tagName === "H1" ||
        element.tagName === "H2" ||
        element.tagName === "H3" ||
        element.tagName === "H4" ||
        element.tagName === "H5" ||
        element.tagName === "H6"
      ) {
        if (current.content !== "") {
          current.content = current.content.trim()
          content.push(current)
        }
        current = {
          title: element.textContent.trim(),
          content: "",
          dom: element
        }
      } else {
        extractContent(element)
      }
    }
  }

  //content.push(current);
}
