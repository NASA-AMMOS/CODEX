import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { WebSocket } from 'mock-socket';

// Configure Enzyme to use an adapter for React 16
Enzyme.configure({ adapter: new Adapter() });

// Expose the mock websocket to the global namespace
global.WebSocket = WebSocket