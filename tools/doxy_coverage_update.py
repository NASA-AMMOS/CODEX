'''
Author: Jack Lightholder
Date  : 11/20/17

Brief : Simple script for update doxygen
			and code coverage reports for
			barefoot rover repository
           
Notes :
'''

import os
import shutil
import numpy as np
## Enviornment variable for setting CODEX root directory.
PROJECT_ROOT = os.getenv('CODEX_ROOT')

## Project wiki address
wikiAddress = "https://github-fn.jpl.nasa.gov/CODEX/CODEX/wiki"

## Project name
projectName = "CODEX"

# Python Standard Libraries
import subprocess, shutil, sys, argparse
from os import listdir
from os.path import isfile, join, isdir

def relativePathConvert(fullPath, relativePath):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """
    if(".." in relativePath):

        # Determine how many levels to reverse
        count = relativePath.count("..")

        # Split level names by /
        fullPathSplit = fullPath.split("/")
        relPathSplit = relativePath.split("/")

        # Filter out potential empty strings at front and end
        fullPathSplit = list(filter(None, fullPathSplit))
        relPathSplit = list(filter(None, relPathSplit))

        # Drop number of reverse levels from end of list
        fullPathSplit = fullPathSplit[:-count]
        relPathSplit = relPathSplit[count:]

        # Re-concatenate list around slashes, add trailing /
        fullPathSubtracted = "/".join(fullPathSplit) + "/"
        relPathAddString = "/".join(relPathSplit) + "/"

        fullPath = fullPathSubtracted + relPathAddString
        fullPath = fullPath.lstrip("/").rstrip("/")
        fullPath = "/" + fullPath + "/"

    else:
        print("Your relative path is missing ellipsis")
	
    return fullPath

def pep8Report(coveragePathList, outputPath, failOnfail=False):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """
    rc = 0
    relDir = {}

    firstPath = coveragePathList[0]

    if not os.path.exists(outputPath):
        os.makedirs(outputPath)

    for directory in coveragePathList:
        print("TESTING " + directory)

        directory_rel = directory.replace(PROJECT_ROOT,'')

        if not os.path.exists(directory + "/tmp/"):
            os.makedirs(directory + "/tmp/")

        files = [f for f in listdir(directory) if isfile(join(directory, f))]
        for file in files:
            if(".py" in file):
                pep8Command = "pycodestyle --show-source --show-pep8 " + directory + file + " > " + directory + "/tmp/" + file.rstrip(".py") + ".txt"
                print("Running: " + pep8Command)
                rc = subprocess.call(pep8Command, shell=True)
                if(rc != 0 and failOnfail == True):
                    print("WARNING: Pep8 file failure: " + pep8Command)
                    print("Exit status: " + str(rc))
                    return rc

                pepper8Command = "pepper8 -o " + outputPath + file.rstrip(".py") + ".html " + directory + "/tmp/" + file.rstrip(".py") + ".txt"
                print("Running: " + pepper8Command)
                rc = subprocess.call(pepper8Command, shell=True)
                if(rc != 0 and failOnfail == True):
                    print("WARNING: Pep8 file failure: " + prepper8Command)
                    print("Exit status: " + str(rc))
                    return rc

                relDir[file.rstrip(".py")] = directory_rel

        np.save(outputPath + "/paths.npy", relDir)
        shutil.rmtree(directory + "/tmp/")

    return rc

def getDoxyOutputPath(doxyFile):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """
    file = open(doxyFile, "r")

    contents = file.readlines()

    outputPath = None

    doxyPathSplit = doxyFile.split("/")
    doxyPathSplit = doxyPathSplit[:-1]
    doxyPath = "/".join(doxyPathSplit) + "/"

    for line in contents:
        if("OUTPUT_DIRECTORY" in line):
            if("=" in line):
                split = line.split("=")
                outputPath = split[1].rstrip("\n")

    if(outputPath is not None):
        if(".." in outputPath):
            outputPath = relativePathConvert(doxyPath, outputPath)
        if("$" in outputPath):
            split = outputPath.split(")")
            outputPath = split[1].rstrip("\n")
            outputPath = PROJECT_ROOT + outputPath

    return outputPath
	
def updateDoxy(doxyFilePath):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """	
    outputPath = getDoxyOutputPath(doxyFilePath)
    print("Output path: " + outputPath)

    command = "doxygen " + doxyFilePath
    subprocess.call(command, shell=True)

    shutil.rmtree(outputPath + "latex/")

    htmlPath = outputPath + "html/"
    files = [f for f in listdir(htmlPath) if isfile(join(htmlPath, f))]
    dirs = [f for f in listdir(htmlPath) if isdir(join(htmlPath, f))]

    for file in files:
        shutil.move(htmlPath + file, outputPath + file)
    for dirName in dirs:
        files2 = [f for f in listdir(htmlPath + dirName + "/") if isfile(join(htmlPath + dirName + "/", f))]
        if not os.path.exists(outputPath + dirName + "/"):
            os.makedirs(outputPath + dirName + "/")
        for file2 in files2:
            shutil.move(htmlPath + dirName + "/" + file2, outputPath + dirName + "/" + file2)

    shutil.rmtree(htmlPath)

	
def updateCoverage(coveragePathList):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """
    rc = 0

    firstPath = coveragePathList[0]

    eraseCommand = "cd " + firstPath + " && coverage erase"
    print("Running: " + eraseCommand)
    subprocess.call(eraseCommand, shell=True)

    for directory in coveragePathList:
        print("TESTING " + directory)
        files = [f for f in listdir(directory) if isfile(join(directory, f))]
        for file in files:
            if(".py" in file):
                coverageCommand = "coverage run -a " + directory + file
                print("Running: " + coverageCommand)
                rc = subprocess.call(coverageCommand, shell=True)
                if(rc != 0):
                    print("WARNING: Unit test file failure: " + coverageCommand)
                    print("Exit status: " + str(rc))
                    return rc

    htmlReportCommand = "coverage html -d " + PROJECT_ROOT + "../tools/website/cov/"
    print("Running: " + htmlReportCommand)

    rc = subprocess.call(htmlReportCommand, shell=True)
    return rc
	
def copytree(src, dst, symlinks=False, ignore=None):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """
    if not os.access(dst, os.W_OK):
        print("WARNING: copytree - cannot copy " + src + " to " + dst + ". Permissions denied")
        return None 

    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, symlinks, ignore)
        else:
            shutil.copy2(s, d)

def doctestFolder(path):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """

    # Test each file individually
    files = [f for f in listdir(path) if isfile(join(path, f))]
    for file in files:
        split = file.split(".")

        fileExtension = split[len(split) - 1]
        if(fileExtension == "py"):
            command = "python " + path + "/" + file
            print("Running: " + command)
            subprocess.call(command, shell=True)
				
def updateWebsite(src,dst):
    """
    Inputs:

    Outputs:

    Notes:

    Examples:


    """
    if not os.path.exists(dst):
        os.makedirs(dst)

    files = [f for f in listdir(dst) if isfile(join(dst, f))]
    dirs = [f for f in listdir(dst) if isdir(join(dst, f))]

    for f in files:
        os.remove(dst + f)

    for d in dirs:
        shutil.rmtree(dst + d)

    copytree(src,dst)

def makePep8Index(folderPath):

    oldindex = open(folderPath + 'template.html','r').readlines()
    files = []
    output = []
    pathDir = np.load(folderPath + "/paths.npy").item()

    # Add all PEP8 reports, except index.html, to index.html contents. 
    fileNames = [f for f in listdir(folderPath) if isfile(join(folderPath, f))]
    for fileName in fileNames:

        if(".html" in fileName and "index" not in fileName and "template.html" not in fileName):
            fileKey = fileName.replace(".html","")
            gitPath = "git/" + pathDir[fileKey]
            newFile = '                 <td class="name left"><a href="' + fileName + '">' + gitPath + fileName.rstrip(".html") + '.py</a></td></tr>\n'
            files.append(newFile)

    for line in oldindex:
        output.append(line)
        if("<!-- FILES -->" in line):
            for file in files:
                output.append(file)

    outfile = open(folderPath + 'index.html','w+')
    for line in output:
        outfile.write(line)

if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument('--doxyFilePath',     help='Full path to doxygen file')
    parser.add_argument('--coveragePathList', help='List of source paths to include. ex: coveragePathList "/full/path/src/,/full/path/tools/"')
    parser.add_argument('--websitePath',      help="Path to the root directory of the website server")
    parser.add_argument('--doctestPath',      help="Path to the directory you wish to standalone doctest")

    args = parser.parse_args()

    # If set to True, the script will fail if pep8 standards are not enforced.  Overkill for current development efforts
    failonfail = False
    
    if(args.doxyFilePath is not None):
        updateDoxy(args.doxyFilePath)
	
    if(args.coveragePathList is not None):
        coveragePathList = args.coveragePathList.split(",")
        coveragePathList = list(map(str.strip, coveragePathList))
        coveragePathList = list(map(str.lower, coveragePathList))
        
        rc = updateCoverage(coveragePathList)
        if(rc != 0):
            print("Unit Tests Failed.")
            sys.exit(rc)
	   
        rc = pep8Report(coveragePathList, PROJECT_ROOT + "../tools/website/pep8/")
        if(rc != 0 and failonfail == True):
            print("Pep8 Report Failed.")
            sys.exit(rc)

        makePep8Index(PROJECT_ROOT + '../tools/website/pep8/')
        
    if(args.websitePath is not None):
        if(args.doxyFilePath is not None):
            contentPath = getDoxyOutputPath(args.doxyFilePath)
            updateWebsite(contentPath,args.websitePath + "/docs/")

        updateWebsite(PROJECT_ROOT + "../tools/website/cov/",args.websitePath + "/cov/")
        updateWebsite(PROJECT_ROOT + "../tools/website/pep8/", args.websitePath + "/pep8/")
        updateWebsite(PROJECT_ROOT + "../tools/website/contacts/", args.websitePath + "/contacts/")
        updateWebsite(PROJECT_ROOT + "../tools/website/", args.websitePath + "/")

    if(args.doctestPath is not None):
        doctestFolder(args.doctestPath)
