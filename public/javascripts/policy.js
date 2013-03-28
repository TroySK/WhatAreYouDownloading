/**
 * Show a dialog with the usage policy of the webapp and checks if it's accepted
 * @param {Function} onaccept Callback if policy was previously accepted
 */
function policy(onaccept, oncancel)
{
    function check()
    {
        return true;
    }

    // Policy text was loaded previously, check if it's accepted
    if(policy.dialog)
        check()

    // Checking the policy the first time on this session, load the policy text
    else
    {
        var http_request = new XMLHttpRequest();
            http_request.open("GET", "policy.html", true);
            http_request.onload = function()
            {
                // Policy text loaded successfully, fill the dialog and check it
                switch(this.status)
                {
                    case 200:   // Ok
                    {
                        // Get policy modification date
                        var lastModified = http_request.getResponseHeader("Last-Modified") || 0;  // January 1, 1970
                        policy.lastModified = (new Date(lastModified)).getTime()

                        // Set the policy text on the dialog
                        policy.dialog = $("#dialog-policy")
                        policy.dialog.html(http_request.response)

                        // Check if policy was accepted
                        check()
                    }
                    break

                    default:    // Error
                        console.error("There was an error loading the Usage Policy")
                }
            };
            http_request.onerror = function()
            {
                console.error("There was an error loading the Usage Policy")
            }
            http_request.send();
    }
}