from sklearn.datasets import load_digits
import numpy as np
import matplotlib.pyplot as plt
import os
import random

outFolder = "/Users/jackal/Desktop/figures/"
digits = load_digits()
data = digits.data
samples, features = data.shape

x = np.arange(0, samples)

# Make 4% of the data outliers in 25% of the features
outlierCount = round(features * 0.25)
for i in range(0, outlierCount):

	featureIndex = random.randint(0, features-1)
	featureData = data[:, featureIndex]
	outlierSampleCount = round(samples * 0.04)
	std = np.std(featureData)
	mean = np.mean(featureData)
	sigma = random.randint(2, 7)

	lowSigma = round(mean - (std * sigma))
	lowSigmaPlusOne = round(mean - (std * (sigma + 1)))
	highSigma = round(mean + (std * sigma))
	highSigmaPlusOne = round(mean + (std * (sigma + 1)))

	for j in range(0, outlierSampleCount):
		index = random.randint(0, samples-1)

		hl = bool(random.getrandbits(1))
		if hl:
			featureData[index] = random.randint(lowSigmaPlusOne, lowSigma)
		else:
			featureData[index] = random.randint(highSigma, highSigmaPlusOne)

	data[:, featureIndex] = featureData

# Make 1% of rows all NaN
nanRowCount = round(samples * 0.01)
for i in range(0, nanRowCount):
	randIndex = random.randint(0, samples-1)
	data[randIndex,:] = np.nan

# Make 3% of all data NaN, not full rows
nanCount = round((samples*features) * 0.03)
for i in range(0, nanCount):
	randRowIndex = random.randint(0, samples-1)
	randColIndex = random.randint(0, features-1)
	data[randRowIndex, randColIndex] = np.nan


# Make random value repeat random amount in 5% of features
repeatFeatureCount = round(features * 0.05)
for i in range(0, repeatFeatureCount):
	repeatFeatureIndex = random.randint(0, features-1)
	featureData = data[:, repeatFeatureIndex]
	repeatVal = featureData[random.randint(0, samples-1)]
	repeatCount = random.randint(0, round(samples/4))
	for j in range(0, repeatCount):
		featureData[random.randint(0, samples-1)] = repeatVal

	data[:, repeatFeatureIndex] = featureData

# Plot each feature
for i in range(0, features):
	y = data[:,i]
	plt.scatter(x, y)
	plt.title('Feature-{i}'.format(i=i))
	plt.xlabel('x')
	plt.ylabel('y')
	plt.savefig(os.path.join(outFolder,'feature_{i}.png'.format(i=i)))
	plt.close()

featureNames = []
for i in range(0, features):
	featureNames.append("feature_{i}".format(i=i))
header = ",".join(featureNames)

np.savetxt(os.path.join(outFolder, 'quality_scan_data.csv'), data, delimiter=',', header=header)



