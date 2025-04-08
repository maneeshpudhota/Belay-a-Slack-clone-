export async function createUrl(endPoint, requestBody, requestHeader, endType){
    let url = endPoint + (Object.keys(requestBody).length > 0 
                          ? ("?" + Object.keys(requestBody).map((key) => key + "=" + encodeURIComponent(requestBody[key])).join("&")) 
                          : "");

    const urlHeaders = new Headers({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Api-Key": localStorage.getItem('maneeshpudhota-api-key'),
        "User-Id": localStorage.getItem('maneeshpudhota-user-id')
    });
  
    Object.keys(requestHeader).forEach(function(key) {
      urlHeaders.append(key, requestHeader[key]);
    });
  
    const myInit = {
      method: endType,
      headers: urlHeaders,
    };

    let data = await fetch(url, myInit);
    let jsonForm = await data.json();
    return jsonForm
}

export function isLoggedin() {
  return !(localStorage.getItem('maneeshpudhota-api-key') == null || localStorage.getItem('maneeshpudhota-api-key') == '')
};
