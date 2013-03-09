# Drive Time Polygon Generator
Generates a very rough polygon describing how far you can drive in all directions within a specified time period (not accounting for traffic).

*Edit the index.html file to enter your Google Maps API Key*

- Works with Google Maps API V3 
- Based on [Driving Radius by Marcelo](http://maps.forum.nu/gm_driving_radius.html)

## How It Works
* Calculates a circle based on a driving speed of ```60 km/hr``` 
* Then picks a set of points that lie on that circle based on the angular resolution ```default: 45 degrees```
* Gets driving directions to the each one of those points from the point of origin
* Cycles through the various legs of these directions and checks to see how far you can travel in a specified period of time ```default: 30 minutes```
* Gets the end point of the last leg that can be completed in under the specified time
* Adds this point to the drive time polygon

## Issues
* The accuracy is restricted due to the query limits
* If the response returns ```OVER_QUERY_LIMIT``` error, then it just waits for 5 seconds and tries again
* Of course this makes the whole process really slow if you want more accurate results