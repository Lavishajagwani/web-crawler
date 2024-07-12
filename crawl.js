const { JSDOM } = require('jsdom') //lets us access DOM api's

// baseurl - home page of the website
// currentURL - url of the page we are actively crawling
// pages - an object that keeps track of the pages and number of times we have crawled it

async function crawlPage(baseURL, currentURL, pages) {

    const baseURLObj = new URL(baseURL)
    const currentURLObj = new URL(currentURL)
    if(baseURLObj.hostname !== currentURLObj.hostname) {
        return pages
    }

    const normalizedCurrentURL = normalizeURL(currentURL)

    if(pages[normalizedCurrentURL] > 0) {
        pages[normalizedCurrentURL]++
        return pages
    }

    pages[normalizedCurrentURL] = 1

    console.log(`actively crawling: ${currentURL}`)

    try {
        
        //a fetch request to the url, by default fetch does a GET request
        const resp = await fetch(currentURL) 

        //condition to check the status code of the response
        if(resp.status > 399) {
            console.log(`error in fetch with status code: ${resp.status} on page: ${currentURL}`)
            return pages
        }

        //condition to check wether the response is html or not
        const contentType = resp.headers.get("content-type")
        if(!contentType.includes("text/html")) {
            console.log(`non html response, content type: ${contentType}, on page: ${currentURL}`)
            return pages
        }

        // .text because we are expecting resp to in html format
        const htmlBody = await resp.text()

        const nextURLs =  getURLsFromHTML(htmlBody, baseURL)
        
        for(const nextURL of nextURLs) {
            pages = await crawlPage(baseURL, nextURL, pages)
        }
    } 
    catch(err) {
        console.log(`error in fetch: ${err.message} on page ${currentURL}`)
    }

    return pages
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