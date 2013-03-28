/**
 * Worker to hash and check existence of a file
 */


// Hack for sha512
var window = {}

importScripts('https://raw.github.com/Caligatio/jsSHA/master/src/sha512.js');


/**
 * Hash the data of a file
 * @param {BinaryString} data Data to be hashed
 * @param {Function} onsuccess Callback called when data was hashed
 */
function hashData(data, onsuccess)
{
	var shaObj = new window.jsSHA(data, "TEXT");
	var hash = shaObj.getHash("SHA-512", "B64").replace('/', '-');

    onsuccess(hash)
}

/**
 * Hash a {Fileentry}
 * @param {Fileentry} fileentry {Fileentry} to be hashed
 */
function hashFileentry(fileentry)
{
  var reader = new FileReader();
      reader.onload = function()
      {
        // this.result is the readed file as an ArrayBuffer.
        hashData(this.result, function(hash)
        {
          fileentry.hash = hash
          self.postMessage(['hashed',fileentry]);
        })
      }

  reader.readAsBinaryString(fileentry.file);
}

/**
 * Check if a {Fileentry} have been removed from the filesystem. If so, request
 * it to be deleted from the database
 * @param {Fileentry} fileentry {Fileentry} to be checked
 */
function checkRemoved(fileentry)
{
  var reader = new FileReader();
      reader.onerror = function()
      {
          self.postMessage(['delete',fileentry]);
      }
      reader.onload = function()
      {
          // [Hack] When (re)moving the file from its original place, Chrome
          // show it with size = 0 and lastModifiedDate = null instead of
          // raising a NotFoundError error
          if(fileentry.file.lastModifiedDate == null)
              self.postMessage(['delete',fileentry]);
      }

  reader.readAsBinaryString(fileentry.file.slice(0,1));
}


/**
 * Receive new petitions to hash or check {Fileentry}s
 * @param {DOMEvent} event
 */
self.onmessage = function(event)
{
  var fileentry = event.data[1]

  switch(event.data[0])
  {
      case 'hash':
          hashFileentry(fileentry)
          break

      case 'refresh':
          checkRemoved(fileentry)
  }
}