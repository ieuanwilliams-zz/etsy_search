NOTES:

The View.Controller was made as abstract as possible within the timeframe for the build, so it could be extended within the scope of specified vendor. However, the code was organized to allow multiple APIs with their own factories, so with some pretty minor refactoring the application could be made to work with any endpoint and whatever specific parametric requirements are needed.

Given correct function, go to your console and log View.Search. You should see 2 objects returned, the first is the query construct, and the second the result construct returned from the Etsy API.

Please note that the Association endpoint was not called for each result. The plan was to provide the main image for each, but time didn't allow for this addition.

TESTS:

1. Support for deep-linked / state maintained via URL
Copy and paste URL in browser, providing whatever local static server name is used: http://{{localhost}}/?page=1&terms=necklace

2. Validate results count works correctly in the case where we display only the returned maximum counts rather than the allowable maximums (with a nod to Warren Zevon)
Copy and paste URL in browser:
http://{{localhost}}/?page=1&terms=lawyers+guns+and+money

3. Confirm pagination is working correctly
Copy and paste URL in browser:
Case 1, we don't need pagination: http://{{localhost}}/?page=1&terms=lawyers+guns+and+money
Case 2, we do need pagination: http://{{localhost}}/?page=1&terms=necklace
