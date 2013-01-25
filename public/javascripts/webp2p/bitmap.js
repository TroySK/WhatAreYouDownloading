/**
 * @classdesc Memory and band-width optimized Bitmap object with random access.
 * @constructor
 * @augments BoolArray
 * @param {Number} length Size of the {Bitmap}
 */
function Bitmap(length)
{
  this.prototype = new BoolArray(length)

  /**
   * Return an array with the index of the setted or unsetted bits.
   * @param {Boolean} [setted] Returned indexes must be setted or unsetted
   * @returns {Array} Array with the index of the setted or unsetted bits
   */
  this.indexes = function(setted)
  {
    var array = []

    for(var i=0; i<this.prototype.length; i++)
      if(this.prototype.get(i) == setted)
        array.push(i)

    return array
  }

  /**
   * Get the index of a random setted or unsetted bit on the bitmap. If none is
   * available, return undefined
   * @param {Boolean} [setted] Returned index must be a setted or unsetted one
   * @returns {Number|undefined} Index of the setted or unsetted bit or
   * undefined if none is available
   */
  this.getRandom = function(setted)
  {
    var array = this.indexes(setted)

    if(array.length)
      return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * Set the value of a bit on the {Bitmap}
   * @param {Number} index Index of the bit to set
   * @param {Boolean} value Value of the bit to set
   */
  this.set = function(index, value)
  {
    this.prototype.set(index, value)
  }
}