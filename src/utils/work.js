// import { EncPasswd} from "@/utils/tool";
require("crypto")
// importScripts('./tool.js');
function EncPasswd(password, cb) {
    return crypto.pbkdf2(String(password), String(password) + "pqb20180625@developmentgroup", 102400, 32, 'sha512', cb);
}
onmessage = (event) => {
    console.log(event.data);
    EncPasswd(event.data, (err, result) => {
        postMessage(result, '*');

    });
}

