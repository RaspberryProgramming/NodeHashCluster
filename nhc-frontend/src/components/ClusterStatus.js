import '../css/ClusterStatus.css';
import Table from './Table';

function App() {
  return (
    <div className="ClusterStatus">
        <h1>ClusterStatus</h1>
        <Table cols={['a', 'b', 'c']} rows={[[1,2,3], [4,5,6]]}/>
    </div>
  );
}

export default App;
