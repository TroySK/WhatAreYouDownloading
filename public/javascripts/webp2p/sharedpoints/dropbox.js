function Dropbox(db, options)
{
    var driver = new Dropbox.Drivers.Popup({receiverFile: "oauth_receiver.html"})

    var client = new Dropbox.Client(options);
        client.authDriver(driver);
        client.authenticate(function(error, client)
        {
            if(error)
            {
                console.error(error)
                dropboxClient = null
            }
        });

    var versionTag = ''

    this.getFiles = function(onsuccess)
    {
        var files = []

        client.readdir('/', {versionTag: versionTag},
        function(error, names, stat, entries)
        {
            versionTag = stat.versionTag

            for(var i=0, entry; entry=entries[i]; i++)
                if(entry.isFile)
                    files.push({path: entry.path, name: entry.name,
                                type: entry.mimeType, size: entry.size})

            onsuccess(files)
        })
    }

    // Start fetching files
    this.getFiles(function(files)
    {
        hasher.hash(files, sharedpoint)
    })
}