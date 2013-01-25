/**
 * Save a {Blob} to the user hard disk
 * @param {Blob} blob {Blob} to be saved
 * @param {String} name Name that will have the saved file
 */
function savetodisk(blob, name)
{
    // Auto-save downloaded file
    var save = document.createElement("A");
        save.href = window.URL.createObjectURL(blob)
        save.target = "_blank"  // This can give problems...
        save.download = name    // This force to download with a filename instead of navigate

    save.click()

    // Hack to remove the ObjectURL after it have been saved and not before
    setTimeout(function()
    {
        window.URL.revokeObjectURL(save.href)
    }, 1000)
}