import { useEffect, useState } from "react";
import { marked } from 'marked';

function IndexSidePanel(props) {
    const [chatCompletion, setChatCompletion] = useState("");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!loaded) {
            setLoaded(true);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { start: true }, function (response) {
                    console.log("response", response);
                    let result = response.choices[0].message.content;

                    setChatCompletion(result)
                });
            });
        }
    }, [chatCompletion])

    return <div><p dangerouslySetInnerHTML={
        { __html: marked.parse(chatCompletion) }
     } /></div>;
}

export default IndexSidePanel;
