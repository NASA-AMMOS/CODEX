'''
Author : Jack Lightholder
Date   : 11/4/2017

Brief  : Script for sending email regarding github wiki updates

Notes  : Based on https://github.com/awbush/github-wiki-notify
'''
import subprocess, argparse
from subprocess import Popen, PIPE


def getPullReport(gitWikiPath):
	'''
	Conducts a pull on the reference clone of the git wiki to see if it has been updated.
	If updated, gets new commit hex string and uses it for difference report

	INPUTS:
		gitWikiPath - string          - string to local directory containing git wiki clone
	OUTPUTS:
		lines       - list of strings - results of git pull attempt. 
	'''
	command = 'cd ' + gitWikiPath + ' && git pull'

	p = Popen(command, stdin=PIPE, stdout=PIPE, stderr=PIPE, shell=True)
	output, rc = p.communicate()

	output = output.decode("utf-8", "ignore")
	lines = output.split("\n")

	return lines


def getCommitHistoryString(gitWikiPath, commitHex, numberOfCommits):

	logCommand = "cd " + gitWikiPath + " && git log --pretty=format:'%h - %s (%cr) <%an>'" + commitHex

	p = Popen(logCommand, stdin=PIPE, stdout=PIPE, stderr=PIPE, shell=True)
	output, rc = p.communicate()
	output = output.decode("utf-8", "ignore")

	lines = output.split("\n")
	lines = lines[0:numberOfCommits]

	commitString = '=== History of Commits (Last ' + str(numberOfCommits) + ") ===\n"
	for line in lines:
		commitString = commitString + "\n" + line

	return commitString


def makeEmailFile(toEmail, fromEmail, subject, bodyMessageList, emailFilePath):
	'''
	Generates a text file, with input content, in the format read by unix sendemail program

	INPUTS:
		toEmail         - string          - who the email will go to. Comma separated
		fromEmail       - string          - email of the sender
		subject         - string          - subject line string
		bodyMessageList - list of strings - each line of the message body
		emailFilePath   - string          - location to store the created file

	OUTPUTS:
		No return
		File created at emailFilePath
	'''
	emailFile = open(emailFilePath, 'w+')

	emailFile.write("To: " + toEmail + "\n")
	emailFile.write("Subject: " + subject + "\n")
	emailFile.write("From: " + fromEmail + "\n\n")

	for line in bodyMessageList:
		emailFile.write(line + "\n")

	emailFile.close()


def composeGithubWikiDiffEmail(gitWikiPath, repoPath, toEmail, fromEmail, subject, emailFilePath):
	'''
	Main function for generating email listing wiki updates and recent wiki commits

	INPUTS:
		gitWikiPath   - string  - Folder containing the cloned github wiki.
		repoPath      - string  - Address of the github repo. 
								 	Ex: https://github-fn.jpl.nasa.gov/BarefootRover/Barefoot_Rover/
		toEmail       - string  - recipient emails, comma separated
		fromEmail     - string  - email address of the sender
		subject       - string  - email subject string
		emailFilePath - string  - path to stash email contents so they can be read by sendmail command  
	OUTPUTS:
		None
	'''
	lines = getPullReport(gitWikiPath)

	if("Updating" in lines[0]):

		split = lines[0].split(".")
		newCommit = split[2]
		
		diffReport = "View the latest changes here: " + repoPath + '/wiki/_compare/'+ newCommit

		commitString = getCommitHistoryString(gitWikiPath, newCommit, 10)

		bodyMessageList = []

		bodyMessageList.append(diffReport)
		bodyMessageList.append("\n")
		bodyMessageList.append(commitString)
	

		makeEmailFile(toEmail, fromEmail, subject, bodyMessageList, emailFilePath)

		sendCommand = '/usr/sbin/sendmail -vt < ' + emailFilePath
		subprocess.call(sendCommand, shell=True)


if __name__ == "__main__":

	parser = argparse.ArgumentParser()
	parser.add_argument('--wikiGitFolder', help='Folder containing the cloned github wiki.', required=True)
	parser.add_argument('--gitAddress',  help='Address of the github repo. Ex: https://github-fn.jpl.nasa.gov/BarefootRover/Barefoot_Rover/', required=True)
	parser.add_argument('--toList', help='Recipients format example: --toList "jack.a.lightholder@jpl.nasa.gov, lukas.mandrake@jpl.nasa.gov"', required=True)
	parser.add_argument('--fromEmail', help='email address to send from', required=True)
	parser.add_argument('--subject', help='Email subject line', required=True)
	parser.add_argument('--emailFilePath', help='Path to stash email contents so they can be read by sendemail command.', required=True)
	args = parser.parse_args()

	composeGithubWikiDiffEmail(args.wikiGitFolder, args.gitAddress, args.toList, args.fromEmail, args.subject, args.emailFilePath)

