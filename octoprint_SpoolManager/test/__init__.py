import unittest

from octoprint_SpoolManager.test.test_DatabaseManager import TestDatabase

def test_all():
    test_classes = [TestDatabase]

    loader = unittest.TestLoader()

    suites_list = []
    for test_class in test_classes:
        suite = loader.loadTestsFromTestCase(test_class)
        suites_list.append(suite)

    big_suite = unittest.TestSuite(suites_list)

    runner = unittest.TextTestRunner()
    runner.run(big_suite)


if __name__ == '__main__':
    test_all()
