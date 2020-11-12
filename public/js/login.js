window.onload = function() {
    var login_btn = document.querySelector(".login-form .confirm-action")
    var pwInput = document.querySelector(".login-form__password")
    login_btn.addEventListener("click", getForm, false)
    pwInput.addEventListener("keyup", function(event) {
        if (event.key == "Enter" && event.keyCode == 13) {
            getForm()
        }
    }, false)

}
function getForm() {
    var username = document.querySelector(".login-form__username").value;
    var password = document.querySelector(".login-form__password").value;
    signin(username, password)
    .then(data => {
        console.log(data)
        console.log(data.success)
        if (data && data.success) { // * Reload page to force redirect from server after 3 seconds
            setTimeout(() => {
                window.location.reload() // Just force a reload, the server will check the cookie and redirect me to the dashboard if it's valid
            }, 1500);
        }
        var formResponseInfo = document.querySelector(".form-response-info")

        formResponseInfoTimeout = setTimeout(() => { // Clear message after 5 seconds
            formResponseInfo.classList.remove("success", "fail")
        }, 5000);

        if(data.success && data.success == true) {
            formResponseInfo.classList.remove("fail")
            formResponseInfo.classList.add("success")
            formResponseInfo.textContent = data.message
        } else {
            formResponseInfo.classList.remove("success")
            formResponseInfo.classList.add("fail")
            formResponseInfo.textContent = data.message
        }
    })
}

// If successfull, server returns JWT token which will be set as cookie to be accessed from the server
async function signin(username, password) {
    var reqBody = {
        username: username,
        password: password
    }
    // console.log(JSON.stringify(reqBody))
    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reqBody)
    })
    var data = await response.json()
    return data
}