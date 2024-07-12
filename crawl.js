const { JSDOM } = require('jsdom') //lets us access DOM api's

async function crawlPage(currentURL) {
    console.log(`actively crawling: ${currentURL}`)

    try {
        
        //a fetch request to the url, by default fetch does a GET request
        const resp = await fetch(currentURL) 

        //condition to check the status code of the response
        if(resp.status > 399) {
            console.log(`error in fetch with status code: ${resp.status} on page: ${currentURL}`)
            return
        }

        //condition to check wether the response is html or not
        const contentType = resp.headers.get("content-type")
        if(!contentType.includes("text/html")) {
            console.log(`non html response, content type: ${contentType}, on page: ${currentURL}`)
            return
        }

        // .text because we are expecting resp to in html format
        console.log(await resp.text()) 

    } catch(err) {
        console.log(`error in fetch: ${err.message} on page ${currentURL}`)
    }
    
}

//htmlBody -> html of the page, baseURL -> url of the page we are going to crawl
function getURLsFromHTML(htmlBody, baseURL) {
    const urls = []
    const dom = new JSDOM(htmlBody)
    const linkElements = dom.window.document.querySelectorAll('a')
    for( const linkElement of linkElements) {
        if(linkElement.href.slice(0,1) === '/') {
            //relative
            try {
                const urlObj = new URL(`${baseURL}${linkElement.href}`)
                urls.push(urlObj.href)
            } catch(err) {
                console.log(`error with relative url: ${err.message}`)
            }
        } else {
            //absolute
            try {
                const urlObj = new URL(linkElement.href)
                urls.push(urlObj.href)
            } catch(err) {
                console.log(`error with absolute url: ${err.message}`)
            }
        }
    }
    return urls
}

function normalizeURL(urlString) {
    const urlObj = new URL(urlString) //using built-in url class
    const hostPath = `${urlObj.hostname}${urlObj.pathname}`
    if(hostPath.length > 0 && hostPath.slice(-1) === '/') {
        return hostPath.slice(0,-1)
    }
    return hostPath
}

module.exports = {
    normalizeURL,
    getURLsFromHTML,
    crawlPage
}