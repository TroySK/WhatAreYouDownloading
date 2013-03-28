function TabDownloading(tableId, preferencesDialogOpen) {
  EventTarget.call(this)

  var self = this

  var table = document.getElementById(tableId)
  this.tbody = table.getElementsByTagName("tbody")[0]


  function noFilesCaption() {
    // Compose no files shared content (fail-back)
    var cell = spanedCell(table)
    cell.appendChild(document.createTextNode("There are no downloads, "))

    var anchor = document.createElement('A')
    anchor.id = 'j-connectUser'
    anchor.style.cursor = 'pointer'
    cell.appendChild(anchor)

    $(anchor).click(preferencesDialogOpen)

    var span = document.createElement('SPAN')
    span.setAttribute("class", "user")
    span.appendChild(document.createTextNode("Connect to a user"))
    anchor.appendChild(span)

    cell.appendChild(document.createTextNode(" and get one!"))

    return cell
  }
  this.noFilesCaption = noFilesCaption()


  function rowFactory(fileentry) {
    var tr = document.createElement('TR');

    var td = document.createElement('TD');
    tr.appendChild(td)

    // Name & icon
    var span = document.createElement('SPAN');
    span.className = filetype2className(fileentry.type)
    span.appendChild(document.createTextNode(fileentry.name));
    td.appendChild(span)

    // Type
    var td = document.createElement('TD');
    td.appendChild(document.createTextNode(fileentry.type));
    tr.appendChild(td)

    // Size
    var td = document.createElement('TD');
    td.className = "filesize"
    td.appendChild(document.createTextNode(humanize.filesize(fileentry.size)));
    tr.appendChild(td)

    // Downloaded
    var td = document.createElement('TD');
    td.className = "filesize"
    td.appendChild(document.createTextNode(humanize.filesize(0)));
    tr.appendChild(td)

    // Progress
    var td_progress = document.createElement('TD');
    td_progress.appendChild(document.createTextNode("0%"));

    self.addEventListener(fileentry.hash, function(event) {
      var value = event.data[0]

      var progress = document.createTextNode(Math.floor(value * 100) + "%")

      while(td_progress.firstChild)
      td_progress.removeChild(td_progress.firstChild);
      td_progress.appendChild(progress);
    })

    tr.appendChild(td_progress)

    // Status
    var td = document.createElement('TD');
    td.appendChild(document.createTextNode("Paused"));
    tr.appendChild(td)

    // Time remaining
    var td = document.createElement('TD');
    td.appendChild(document.createTextNode("Unknown"));
    tr.appendChild(td)

    // Speed
    var td = document.createElement('TD');
    td.className = "filesize"
    td.appendChild(document.createTextNode(humanize.filesize(0) + "/s"));
    tr.appendChild(td)

    // Peers
    var td = document.createElement('TD');
    td.appendChild(document.createTextNode("0"));
    tr.appendChild(td)

    // Inclusion date
    var td = document.createElement('TD');
    td.class = "end"
    td.appendChild(document.createTextNode("0-0-0000"));
    tr.appendChild(td)

    return tr
  }

  this.updateFiles = function(fileslist) {
    for(var i = 0, fileentry; fileentry = fileslist[i]; i++) {
      // Calc path
      var path = ""
      if(fileentry.sharedpoint) path += fileentry.sharedpoint + '/';
      if(fileentry.path) path += fileentry.path + '/';

      var name = ""
      if(fileentry.file) name = fileentry.file.name
      else name = fileentry.name

      var child = path.split('/').slice(0, -1).join('/').replace(' ', '')

      // Add file row
      var tr = rowFactory(fileentry)
      //                tr.id = path + name
      if(child) tr.setAttribute('class', "child-of-" + child)

      this.tbody.appendChild(tr)
    }
  }


  this.update = function(fileslist) {
    // Fill the table
    FilesTable.update.call(this, fileslist)
  }
}
TabDownloading.prototype = FilesTable