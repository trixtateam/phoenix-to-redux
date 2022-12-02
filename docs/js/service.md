# Socket Service
[Phoenix channels](https://hexdocs.pm/phoenix/channels.html#the-moving-parts) are highly reliant, fast and robust. The phoenix js
package makes it very easy to setup a connection and listen on channels and respond on channels.

Check out the [official documentation](https://hexdocs.pm/phoenix/js/index.html)
for a good explanation of the more intricate benefits it has.

## Using the socket service
[`service`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/services/socket.js)
To communicate with phoenix socket, you can make use of the socket service
```javascript
import {
  socketService,
} from '@trixtateam/phoenix-to-redux';
const socket = socketService.initialize('localhost:3000')
socket.onOpen(function(){ console.info("the socket was opened") });
socket.onError(function(error){ alert("An error occurred") });
socket.connect();

```
