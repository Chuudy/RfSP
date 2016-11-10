function checkPrefs() {
    var all_valid = true
    if (alg.settings.value("RMANTREE") == undefined) {
        all_valid = false
        alg.log.warn("RMANTREE = " + alg.settings.value("RMANTREE"))
    }
    if (alg.settings.value("RMSTREE") == undefined) {
        all_valid = false
        alg.log.warn("RMSTREE = " + alg.settings.value("RMSTREE"))
    }
    if (alg.settings.value("saveTo") == undefined) {
        all_valid = false
        alg.log.warn("saveTo = " + alg.settings.value("saveTo"))
    }
    return all_valid
}


// FIXME: the bxdf param is currently ignored.

function exportAssets(bxdf) {

    // bail out if the prefs are not all filled
    //
    var valid = checkPrefs()
    if (!valid) {
        alg.log.error("RenderMan: Please open the configure panel and fill all fields !")
        return
    }

    // Some useful variables
    //
    var sep = "/"
    var pyBin = "python"
    if (Qt.platform.os == "windows") {
        sep = "\\"
        pyBin += ".exe"
    }
    var ext = ".png"
    var script = "rmanAssetsSubstancePainter.py"
    var exportPath = ""
    var jsonFilePath = ""
    var tab = "    "
    var tab2 = tab + tab
    var tab3 = tab2 + tab
    var tab4 = tab3 + tab

    // Query export path
    //
    exportPath = alg.mapexport.exportPath() + sep + "RenderMan" + sep
    jsonFilePath = exportPath + "RmanExport.json"

    // Export masks
    //
    var matIdx = 0
    var channelIdx = 0
    var document = alg.mapexport.documentStructure()
    var fileContent = "{\n"

    // store env vars
    //
    fileContent += tab + "\"RMANTREE\": \"" + alg.settings.value("RMANTREE") + "\",\n"
    fileContent += tab + "\"RMSTREE\": \"" + alg.settings.value("RMSTREE") + "\",\n"
    fileContent += tab + "\"saveTo\": \"" + alg.settings.value("saveTo") + "\",\n"
    fileContent += tab + "\"document\": [\n"

    // Parse all materials (texture sets)
    //
    for (matIdx = 0; matIdx < document.materials.length; matIdx++) {
        var material = document.materials[matIdx].name
        fileContent += tab2 + "{\n"
        fileContent += tab3 + "\"textureSet\": \"" + material + "\",\n"
        fileContent += tab3 + "\"channels\": {\n"
        // alg.log.info("RenderMan: Texture Set \"" + material + "\" : ")

        var numChannels = document.materials[matIdx].stacks[0].channels.length
        for (channelIdx = 0; channelIdx < numChannels; channelIdx++) {
            var thisChannel = document.materials[matIdx].stacks[0].channels[channelIdx]
            // alg.log.info("RenderMan:   | " + thisChannel)

            var output = exportPath + material + "_" + thisChannel + ext

            var materials = []
            materials[0] = material
            materials[1] = thisChannel

            alg.mapexport.save(materials, output)
            // alg.log.info("RenderMan:   |_ Exported : " + output)

            // Prepare Data for json file
            //
            fileContent += tab4 + "\"" + thisChannel + "\": \"" + output + "\""
            if (channelIdx < numChannels - 1)
                fileContent += ",\n"
            else
                fileContent += "\n"
        }
        if (matIdx < document.materials.length - 1)
            fileContent += tab3 + "}\n" + tab2 + "},\n"
        else
            fileContent += tab3 + "}\n" + tab2 + "}\n"
    }
    fileContent += tab + "]\n}\n"

    // Write json file and export
    //
    if (fileContent.length > 0) {
        alg.log.info("RenderMan: Writing " + jsonFilePath + "...")

        // write json file needed by the python script
        //
        var jsonFile = alg.fileIO.open(jsonFilePath, "w")
        jsonFile.write(fileContent)
        jsonFile.close()

        // Call python
        // FIXME: we should probably just catch exceptions and print the log on error.
        //
        var fpath = "\"" + jsonFilePath + "\""
        var result = alg.subprocess.check_output([pyBin, script, fpath])
        alg.log.info("RenderMan: Python : " + result)
    }
    else {
        alg.log.error("RenderMan: Nothing to export !")
    }
    alg.log.info("RenderMan: Export successful ! :)")
}
