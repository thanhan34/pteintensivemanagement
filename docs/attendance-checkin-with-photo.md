# Attendance Check-In with Location Tracking Feature

## Overview
This document describes the new location-based attendance check-in/check-out system with geolocation tracking for Sale and Administrative Assistant roles.

## Features Implemented

### 1. **Role Access**
- **Trainer**: Continues to use the existing TrainerDashboard for attendance
- **Administrative Assistant**: Now has access to photo-based check-in/check-out + backfill functionality
- **Saler (Sale)**: New role with access to photo-based check-in/check-out
- **Admin**: Can view all attendance records including photos and locations

### 2. **Geolocation Tracking**
- Automatically captures GPS coordinates when taking photos
- Records latitude and longitude with 6 decimal precision
- Attempts to resolve coordinates to human-readable address using reverse geocoding
- Falls back to coordinate display if reverse geocoding fails
- Timestamps are recorded for both check-in and check-out

### 3. **Data Structure**
Extended `AttendanceRecord` type to include:
```typescript
{
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;              // Human-readable address
    timestamp: string;             // ISO timestamp
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
  };
}
```

### 4. **User Interface**

#### Check-In Flow:
1. Click "CHECK IN" button
2. Browser requests location permission
3. System captures GPS coordinates and timestamp
4. Address is resolved via reverse geocoding (if available)
5. Record created with location data
6. Success notification displayed

#### Check-Out Flow:
1. Click "CHECK OUT" button (only available when checked in)
2. Same location capture process
3. Record updated with check-out location and time
4. Success notification displayed

### 5. **Location Viewing**
- New "Location" column in AttendanceList table
- Shows indicators for check-in and check-out locations
- "View Location" button opens modal with:
  - Session details (date, time, hours)
  - Check-in location with address, coordinates, and timestamp
  - Check-out location with address, coordinates, and timestamp
  - "View on Google Maps" links for both locations

### 6. **Browser Permissions Required**
- **Location Access**: Required to capture GPS coordinates
- Users will be prompted to grant location permissions on first use

### 7. **Offline/Error Handling**
- If location access is denied: Error message displayed
- If geolocation fails: Error message with troubleshooting info
- If reverse geocoding fails: Coordinates displayed instead of address
- All errors are user-friendly and actionable

## Files Modified/Created

### New Files:
1. `app/components/AttendanceCheckIn.tsx` - New component for photo-based check-in/out

### Modified Files:
1. `app/types/roles.ts` - Extended AttendanceRecord interface
2. `app/attendance/page.tsx` - Added support for Sale and Administrative Assistant roles
3. `app/components/AttendanceList.tsx` - Added photo/location column and viewing modal

## Configuration Requirements

### Firestore Security Rules
Update rules to allow Sale and Administrative Assistant to create/update attendance:

```javascript
match /attendance/{attendanceId} {
  // Allow trainers, admins, sales, and admin assistants to create
  allow create: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['trainer', 'admin', 'saler', 'administrative_assistant']);
  
  // Allow users to read their own attendance or admins to read all
  allow read: if request.auth != null && 
    (resource.data.trainerId == request.auth.uid || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'administrative_assistant']);
  
  // Allow users to update their own pending records or admins to update any
  allow update: if request.auth != null && 
    ((resource.data.trainerId == request.auth.uid && resource.data.status == 'pending') || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'administrative_assistant']);
  
  // Allow users to delete their own pending records or admins to delete any
  allow delete: if request.auth != null && 
    ((resource.data.trainerId == request.auth.uid && resource.data.status == 'pending') || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}
```

## Testing Checklist

### For Sale/Administrative Assistant Users:
- [ ] Navigate to /attendance page
- [ ] Grant location permissions when prompted
- [ ] Click "CHECK IN" button
- [ ] Verify location is captured and check-in succeeds
- [ ] Verify session appears in "Today's Sessions" with location
- [ ] Click "CHECK OUT" button
- [ ] Verify location is captured and check-out succeeds
- [ ] View attendance list and verify record exists
- [ ] Click "View Location" to see location details
- [ ] Verify Google Maps links work

### For Admin Users:
- [ ] View all attendance records
- [ ] Filter by user/date range
- [ ] View locations for records with location data
- [ ] Approve/reject attendance records
- [ ] Export to Excel (verify location data if needed)

## Security Considerations

1. **Location Privacy**: Location data is only captured when user explicitly checks in/out
2. **Access Control**: Only authorized roles can check in/out
3. **Data Validation**: All location data is validated before storage
4. **Coordinate Accuracy**: GPS coordinates are stored with 6 decimal precision for accuracy

## Future Enhancements

Potential improvements for future versions:
1. Geofencing to ensure check-ins occur at valid locations
2. Location history tracking and analysis
3. Automated location verification
4. Distance calculation between check-in and check-out locations
5. Notification alerts for unusual check-in locations
6. Offline location caching for areas with poor connectivity

## Troubleshooting

### Location Not Capturing
- Ensure location services enabled on device
- Grant browser location permission
- Check internet connectivity for reverse geocoding

### Reverse Geocoding Issues
- Check internet connectivity
- API may have rate limits
- Falls back to coordinates if address resolution fails
- No impact on core functionality

## Support

For issues or questions, contact the development team or create a ticket in the project management system.
