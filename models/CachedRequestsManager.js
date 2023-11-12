import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import {log} from "../log.js";

const repositoryCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

export default class CachedRequestsManager
{
    static cachedRequests = [];
    static add(url, content, eTag= "")
    {
        if (url != "") {
            CachedRequestsManager.clear(url);
            CachedRequestsManager.cachedRequests.push({
                url,
                content,
                eTag,
                Expire_Time: utilities.nowInSeconds() + repositoryCachesExpirationTime
            });
            console.log("Request data of " + url + " added in request cache");
        }
    }
    static find(url)
    {
        try {
            if (url != "") {
                for (let cache of CachedRequestsManager.cachedRequests) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + repositoryCachesExpirationTime;
                        console.log("Request data of " + url + " retreived from request cache");
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log("Request cache error!", error);
        }
        return null;
    }
    static clear(url)
    {
        if (url != "") {
            const indexToDelete = [];
            let index = 0;
            for (let cache of CachedRequestsManager.cachedRequests) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(CachedRequestsManager.cachedRequests, indexToDelete);
        }
    }
    static flushExpired()
    {
        const indexToDelete = [];
        const now = utilities.nowInSeconds();
        let index = 0;
        for (let cache of CachedRequestsManager.cachedRequests) {
            if (cache.Expire_Time < now) {
                console.log("Cached request data of " + cache.url + " expired");
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(CachedRequestsManager.cachedRequests, indexToDelete);
    }
    static get(httpContext)
    {
        const cache = CachedRequestsManager.find(httpContext.req.url);
        if (cache === null) return false;

        httpContext.response.JSON(cache.content, cache.eTag, true);
        return cache.content;
    }
}

setInterval(CachedRequestsManager.flushExpired, repositoryCachesExpirationTime * 1000);
log(BgWhite, FgBlack, "Periodic request cache cleaning process started...");
