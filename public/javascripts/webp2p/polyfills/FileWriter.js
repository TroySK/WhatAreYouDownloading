/**
 * FileWriter polyfill based on code from idb.filesystem.js by Eric Bidelman
 * @copyright 2012 Jesus Leganes Combarro "Piranna"
 */

(function(module){

if(window.FileWriter != undefined)
    return;

Blob.slice = Blob.slice || Blob.webkitSlice || Blob.mozSlice
if(Blob.slice != undefined)
    alert("It won't work in your browser. Please use Chrome or Firefox.");

/**
 * Interface to writing a Blob/File.
 *
 * Modeled from:
 * dev.w3.org/2009/dap/file-system/file-writer.html#the-filewriter-interface
 *
 * @param {Blob} blob The Blob associated with this writer.
 * @constructor
 */
FileWriter = function(blob)
{
  if(!blob)
    throw Error('Expected blob argument to write.');

  var position_ = 0;
  var blob_ = blob;


  /**
   * Getter of the current position of the blob index
   * @returns {Number} The position of the index inside the blob
   */
  this.__defineGetter__('position', function()
  {
    return position_;
  });

  /**
   * Getter of the current length of the blob
   * @returns {Number} The current lenght of the blob
   */
  this.__defineGetter__('length', function()
  {
    return blob_.size;
  });


  /**
   * Move the current index of the blob
   * @param {Number} offset The new position of the blob index
   */
  this.seek = function(offset)
  {
    position_ = offset

    if(position_ > this.length)
       position_ = this.length
    else if(position_ < 0)
       position_ += this.length

    if(position_ < 0)
       position_ = 0
  };

  /**
   * Truncate the blob size the the new value
   * @param {Number} size The new size of the blob (bigger or smaller)
   */
  this.truncate = function(size)
  {
    if(size < this.length)
      blob_ = blob_.slice(0, size)
    else
      blob_ = new Blob([blob_, new Uint8Array(size - this.length)],
                        {"type": blob_.type})
  };

  /**
   * Write some data on the current position of the blob index
   * @param data Data to be written
   */
  this.write = function(data)
  {
    if(!data)
        return;

    // Call onwritestart if it was defined.
    if(this.onwritestart)
       this.onwritestart();

    // Calc the head and tail fragments
    var head = blob_.slice(0, position_)
    var tail = blob_.slice(position_ + data.length)

    // Calc the padding
    var padding = position_ - head.size
    if(padding < 0)
       padding = 0;

    // Do the "write" --in fact, a full overwrite of the Blob
    blob_ = new Blob([head, new Uint8Array(padding), data, tail],
                      {"type": blob_.type})

    // Set writer.position == write.length.
    position_ += data.size;

    if(this.onwriteend)
       this.onwriteend();

    // This is not standard, but it's the only way to get out the created blob
    return blob_
  }
}

})(this)
