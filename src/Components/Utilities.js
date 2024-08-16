    // arrays
    export const navbarButtons = [
      {
        label:"Home",
        to:"/songsearch",
      },
      {
          label:"Playlists",
          to:"/playlist",
      },
      {
          label:"Statistics",
          to:"/statistics",
      },
      {
          label:"Sales",
          to:"/saleswindow",
      },
      {
          label:"Cart",
          to:"/cart",
      }
    ]
    
    // functions
    export function millisecondsToMinutes(time) {
        let totalSeconds = Math.floor(time / 1000);
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        let formattedTime = `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
        return formattedTime;
    }

    export function formatTotal(value) {
        const formattedValue = Number(value).toFixed(2);
        return formattedValue;
    }

    export function formatCell(row, id) {
        switch (id) {
          case 'Milliseconds':
            return millisecondsToMinutes(row[id]);
    
          case 'UnitPrice':
            return `${formatTotal(row[id])}$`;
    
          case 'Total':
            return `${formatTotal(row[id])}$`;
    
          default:
            return row[id];
        }
      }