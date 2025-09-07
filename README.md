# NFL Wins Tracker 🏈

A web-based NFL wins tracker that automatically refreshes to show current team standings and calculates **total wins per person** based on their team assignments.

## Key Features

- **🎯 Total Wins per Person**: Clear display of each person's cumulative wins across all their teams
- **📊 Real-time NFL Data**: Fetches current team standings from ESPN's API
- **🔄 Auto-refresh**: Updates every 5 minutes or refresh manually
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **📈 Team Performance**: View all teams sorted by wins with owner information

## How to Use

### Quick Start
1. Open `index.html` in your web browser
2. The app automatically loads current NFL data
3. See each person's **total wins** prominently displayed
4. Use the refresh button for manual updates
5. Toggle auto-refresh on/off as needed

### Understanding the Display

**Person Summary Cards** (sorted by total wins):
- **Large number**: Total wins across all their teams
- **Teams**: Number of teams owned
- **Avg Wins/Team**: Average performance
- **Best Teams**: Top 3 performing teams
- *Bet amounts shown as reference notes*

**Team Details Section**:
- All 32 NFL teams sorted by current wins
- Shows owner, current record, and wins
- *Bet amounts in parentheses as notes*

## Team Assignments

Each person owns multiple NFL teams:

- **James**: 6 teams (Broncos, Patriots, Bengals, Browns, Cowboys, Saints)
- **Peter**: 4 teams (Ravens, Jets, Seahawks, Lions) 
- **Anh**: 4 teams (Bills, Chiefs, Packers, Buccaneers)
- **Jamie**: 6 teams (Panthers, Giants, Chargers, Dolphins, Steelers, Vikings)
- **Kris**: 7 teams (Titans, Bears, Falcons, 49ers, Colts, Jaguars, Raiders)
- **Ross**: 5 teams (Eagles, Texans, Cardinals, Commanders, Rams)

## Deployment Options

This is a pure HTML/CSS/JavaScript app that can be deployed anywhere:

### GitHub Pages (Recommended)
1. Create a GitHub repository
2. Upload all files
3. Enable Pages in repository settings
4. Share the generated URL

### Other Options
- **Netlify**: Drag & drop the folder to [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: Connect GitHub repo for instant deployment
- **Local**: Just open `index.html` in any browser

## Technical Notes

- **No frameworks needed**: Pure vanilla JavaScript
- **API**: Uses ESPN's public NFL API
- **Fallback**: Includes mock data for offline testing
- **Mobile-first**: Responsive design for all devices
- **Auto-refresh**: Configurable interval updates

## Files

```
nfl-wins-tracker/
├── index.html    # Main page
├── styles.css    # Styling with emphasis on win totals
├── app.js       # Application logic & API integration
├── data.js      # Team assignments and mappings
└── README.md    # This file
```

---

**Focus**: Track and compare total NFL wins per person across their assigned teams! 🏆
