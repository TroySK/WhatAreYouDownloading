function No_FileReader() {
  $('#Sharedpoints').html('Your browser is not modern enough to serve as a host. :(<br /><br />(Try Chrome or Firefox!)');
}


function TableSharedpoints(tableId, onclickFactory) {
  var table = document.getElementById(tableId)
  this.tbody = table.getElementsByTagName("tbody")[0]


  function noFilesCaption() {
    // Compose no files shared content (fail-back)
    var cell = spanedCell(table)
    cell.appendChild(document.createTextNode("There are no shared points. "))

    var anchor = document.createElement('A')
    anchor.style.cursor = 'pointer'
    cell.appendChild(anchor)

    $(anchor).click(function() {
      $('#files').click()
    })

    var span = document.createElement('SPAN')
    span.setAttribute("class", "add-sharedpoint")
    span.appendChild(document.createTextNode("Please add some folders"))
    anchor.appendChild(span)

    cell.appendChild(document.createTextNode(" to be shared."))

    return cell
  }
  this.noFilesCaption = noFilesCaption()


  function rowFactory(fileentry) {
    var tr = document.createElement('TR');

    var td = document.createElement('TD');
    tr.appendChild(td)

    // Name & icon
    var span = document.createElement('SPAN');
    span.className = fileentry.type
    span.appendChild(document.createTextNode(fileentry.name));
    td.appendChild(span)

    // Shared size
    var td = document.createElement('TD');
    td.className = "filesize"
    td.appendChild(document.createTextNode(humanize.filesize(fileentry.size)));
    tr.appendChild(td)

    var td = document.createElement('TD');
    td.class = "end"
    tr.appendChild(td)

    var a = document.createElement("A");
    a.onclick = onclickFactory(fileentry)
    a.appendChild(document.createTextNode("Delete"));
    td.appendChild(a);

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
      //                    tr.id = path + name
      if(child) tr.setAttribute('class', "child-of-" + child)

      this.tbody.appendChild(tr)
    }
  }
}
TableSharedpoints.prototype = FilesTable