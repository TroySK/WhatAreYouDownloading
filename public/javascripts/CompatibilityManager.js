/**
 * @classdesc Show an alert about the compatibility issues of the webapp
 * @constructor
 */
function CompatibilityManager()
{
    var errors
    var warnings

    /**
     * Add an error to the list of compatibility issues. This is mainly intended
     * for issues that would not allow to the webapp to work correctly at all.
     * @param {String} component Name of the component that has the issue
     * @param {String} msg Message to show to the user about the issue
     */
    this.addError = function(component, msg)
    {
        errors = errors || {}
        errors[component] = msg
    }

    /**
     * Add a warning to the list of compatibility issues. This is mainly
     * intended for issues that would not allow to the webapp to work optimaly,
     * maybe using a polyfill or having some functionality disabled.
     * @param {String} component Name of the component that has the issue
     * @param {String} msg Message to show to the user about the issue
     */
    this.addWarning = function(component, msg)
    {
        warnings = warnings || {}
        warnings[component] = msg
    }

    /**
     * Show the alert to the user after all the issues have been collected.
     * It will be shown the first time the webapp is used on a browser, there're
     * error-cataloged issues or compatibility status has changed (mainly after
     * a browser update).
     */
    this.show = function()
    {
        var msg = "<p>This will not work "
        var icon

        if(errors)
        {
            icon = "../images/smiley-sad.svg"

            msg += "on your browser because it doesn't meet the following requirements:</p>"

            msg += '<ul style="list-style: none;">'
            for(var key in errors)
                msg += '<li><b>'+key+'</b>: '+errors[key]+'</li>';
            msg += '</ul>'

            if(warnings)
            {
                msg += "<p>Also, it wouldn't work optimally because the following issues:</p>"

                msg += '<ul style="list-style: none;">'
                for(var key in warnings)
                    msg += '<li><b>'+key+'</b>: '+warnings[key]+'</li>';
                msg += '</ul>'
            }
        }
        else if(warnings)
        {
            icon = "../images/smiley-quiet.svg"

            msg += "optimally on your browser because the following issues:</p>"

            msg += '<ul style="list-style: none;">'
            for(var key in warnings)
                msg += '<li><b>'+key+'</b>: '+warnings[key]+'</li>';
            msg += '</ul>'
        }

        function showDialog(icon, msg)
        {
            var alert = $("#dialog-compatibility")
                alert.find("#icon")[0].src = icon
                alert.find("#msg").html(msg)

            alert.dialog(
            {
                modal: true,
                resizable: false,
                width: 800,

                buttons:
                {
                    Ok: function()
                    {
                        $(this).remove()
    //                  $(this).dialog("destroy");
                    }
                }
            });
        }

        // Browser is not fully compatible, show why if compatibility changed
        if(errors || warnings)
        {
            // Prepare an object with the warnings and the errors to be inserted
            var newCompatibility = {}
            if(errors) newCompatibility.errors = errors
            if(warnings) newCompatibility.warnings = warnings
            newCompatibility = JSON.stringify(newCompatibility)

            // Check if compatibility status has changed and notify to user
            if(errors
            || localStorage.compatibility != newCompatibility)
            {
                msg += "<p>Please upgrade to the latest version of Chrome/Chromium or Firefox.</p>"

                alert(msg)

                localStorage.compatibility = newCompatibility
            }
        }

        // Browser have been upgraded and now it's fully compatible
        else if(localStorage.compatibility)
        {
            alert("Congratulations! Your browser is now fully compatible.")

            localStorage.removeItem('compatibility')
        }
    }
}