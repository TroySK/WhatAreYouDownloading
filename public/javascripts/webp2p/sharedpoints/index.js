function SharedpointsManager(db, hasher)
{
    this.getSharedpoints = function(onsuccess)
    {
        db.sharepoints_getAll(null, onsuccess)
    }

//    var sharedpoints = []
//
//    this.getSharedpoints(function(sharedpoints)
//    {
//        for(var i=0, sharedpoint; sharedpoint= sharedpoints[i]; i++)
//        {
//            switch(sharedpoint.type)
//            {
//                case 'dropbox':
//                    break
//
//                case 'folder':
//                    break
//            }
//        }
//    })

    this.addSharedpoint_Folder = function(files, onsuccess, onerror)
    {
      var sharedpoint_name = files[0].webkitRelativePath.split('/')[0]

      this.getSharedpoints(function(sharedpoints)
      {
          for(var i=0, sharedpoint; sharedpoint= sharedpoints[i]; i++)
              if(sharedpoint.name == name)
              {
                  if(onerror)
                      onerror()

                  return
              }

          var sharedpoint = {name: sharedpoint_name, type: 'folder', size: 0}

          db.sharepoints_put(sharedpoint)

          hasher.hash(files, sharedpoint_name)

          if(onsuccess)
              onsuccess()
      })
    }
}