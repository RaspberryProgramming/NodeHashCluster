import '../css/ClusterStatus.css';
import Table from './Table';
import InfoBox from './InfoBox';

function ClusterStatus() {
  return (
    <div className="ClusterStatus">
        <h1>ClusterStatus</h1>
        <InfoBox title="Title" stat='55' measure='mph'/>
        <InfoBox title="Name" stat='Carl Jr.'/>
        <Table cols={['a', 'b', 'c']} rows={[[1,2,3], [4,5,6]]}/>
        
    </div>
  );
}

export default ClusterStatus;
