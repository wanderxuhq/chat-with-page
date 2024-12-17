import IndexSidePanel  from "~IndexSidePanel"

import { isProbablyReaderable, Readability } from "@mozilla/readability"
import OpenAI from "openai"

import { kmeans } from "./kmeans"
import React from "react"

console.log('main');

/*
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

//export { findMainDOM }
//export {}


function getJson(jsonStr) {
  var stringStack = new stack();
  var indexList = [];
  var jsonList = [];
  for (var i = 0; i < jsonStr.length; i++) {
    if (jsonStr.charAt(i) == '{' || jsonStr.charAt(i) == '[') {
      stringStack.push(new JsonStack(i, jsonStr.charAt(i)));
    } else if (jsonStr.charAt(i) == '}' || jsonStr.charAt(i) == ']') {
      if (stringStack.dataStore.length != 0) {
        var js = stringStack.peek();
        if (jsonStr.charAt(i) == '}' && js.char == '{') {
          js = stringStack.pop();
        } else if (jsonStr.charAt(i) == ']' && js.char == '[') {
          js = stringStack.pop();
        }
        indexList.push(js.index);
        indexList.push(i);
      }
    }
    if (stringStack.dataStore.length == 0 && indexList.length > 0) {
      var tempStr = getJsonStr(indexList, jsonStr);
      if (!(tempStr == null || tempStr.length == 0)) {
        jsonList.push(tempStr);
      }
      indexList.splice(0, indexList.length);;
    }
  }
  if (indexList != null && indexList.length > 0) {
    var tempStr = getJsonStr(indexList, jsonStr);
    if (!(tempStr == null || tempStr.length == 0)) {
      jsonList.push(tempStr);
    }
  }
  if (jsonList != null && jsonList.length > 0) {
    return jsonList[0];
  } else {
    return null;
  }
}
function getJsonStr(indexList, str) {
  var temp = "";
  for (var i = indexList.length - 1; i >= 0; i = i - 2) {
    try {
      temp = str.substring(indexList[i - 1], indexList[i] + 1);
      JSON.parse(temp);
      return temp;
    } catch (e) {
      continue;
    }
  }
  return null;
}
function JsonStack(index, char) {
  this.index = index;
  this.char = char;
}
function stack() {
  this.dataStore = [];//保存栈内元素，初始化为一个空数组
  this.top = 0;//栈顶位置，初始化为0
  this.push = push;//入栈
  this.pop = pop;//出栈
  this.peek = peek;//查看栈顶元素
  this.clear = clear;//清空栈
  this.length = length;//栈内存放元素的个数
}
function push(element) {
  this.dataStore[this.top++] = element;
}
function pop() {
  return this.dataStore[--this.top];
}
function peek() {
  return this.dataStore[this.top - 1];
}
function clear() {
  this.top = 0;
}
function length() {
  return this.top;
}
*/


class IndexSidePanel1 {
  state = {
    data: "",
    chatCompletion: []
  }
  constructor(props) {
    //super(props)
    const _this = this;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log(tabs)
      chrome.tabs.sendMessage(tabs[0].id, { start: true }, function (response) {
        console.log("response", response);
        let result = response.choices[0].message.content;
        if (!Array.isArray(result)) {
          result = [result];
        }
        //_this.setState({
        //  chatCompletion: result
        //});
      });
    });


    // Regex-pattern to check URLs against. 
    // It matches URLs like: http[s]://[...]stackoverflow.com[...]
    var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com/;
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 16
        }}>
        {

          <Snip title="1" content={this.state.chatCompletion[0].message.content} index="1"></Snip>
          /*
          this.state.chatCompletion.map(function (completion, i) {
            //return <div onClick={this.handleClick}><h3>{completion.title}</h3><p>{completion.content}</p></div>;

            return <Snip title="1" content={completion.content} index={i}></Snip>
          })*/
        }
      </div>
    )
  }
}

/*
class Snip extends React.Component {
  constructor(props) {
    super(props)
    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    console.log(e)
    console.log(this);
  }

  render() {
    return (
      <div onClick={this.handleClick}><h3>{this.props.title}</h3><p>{completion.content}</p></div>
    )
  }
}
*/

export default IndexSidePanel



function getJson(jsonStr) {
  var stringStack = new stack();
  var indexList = [];
  var jsonList = [];
  for (var i = 0; i < jsonStr.length; i++) {
    if (jsonStr.charAt(i) == '{' || jsonStr.charAt(i) == '[') {
      stringStack.push(new JsonStack(i, jsonStr.charAt(i)));
    } else if (jsonStr.charAt(i) == '}' || jsonStr.charAt(i) == ']') {
      if (stringStack.dataStore.length != 0) {
        var js = stringStack.peek();
        if (jsonStr.charAt(i) == '}' && js.char == '{') {
          js = stringStack.pop();
        } else if (jsonStr.charAt(i) == ']' && js.char == '[') {
          js = stringStack.pop();
        }
        indexList.push(js.index);
        indexList.push(i);
      }
    }
    if (stringStack.dataStore.length == 0 && indexList.length > 0) {
      var tempStr = getJsonStr(indexList, jsonStr);
      if (!(tempStr == null || tempStr.length == 0)) {
        jsonList.push(tempStr);
      }
      indexList.splice(0, indexList.length);;
    }
  }
  if (indexList != null && indexList.length > 0) {
    var tempStr = getJsonStr(indexList, jsonStr);
    if (!(tempStr == null || tempStr.length == 0)) {
      jsonList.push(tempStr);
    }
  }
  if (jsonList != null && jsonList.length > 0) {
    return jsonList[0];
  } else {
    return null;
  }
}
function getJsonStr(indexList, str) {
  var temp = "";
  for (var i = indexList.length - 1; i >= 0; i = i - 2) {
    try {
      temp = str.substring(indexList[i - 1], indexList[i] + 1);
      JSON.parse(temp);
      return temp;
    } catch (e) {
      continue;
    }
  }
  return null;
}
function JsonStack(index, char) {
  this.index = index;
  this.char = char;
}
function stack() {
  this.dataStore = [];//保存栈内元素，初始化为一个空数组
  this.top = 0;//栈顶位置，初始化为0
  this.push = push;//入栈
  this.pop = pop;//出栈
  this.peek = peek;//查看栈顶元素
  this.clear = clear;//清空栈
  this.length = length;//栈内存放元素的个数
}
function push(element) {
  this.dataStore[this.top++] = element;
}
function pop() {
  return this.dataStore[--this.top];
}
function peek() {
  return this.dataStore[this.top - 1];
}
function clear() {
  this.top = 0;
}
function length() {
  return this.top;
}