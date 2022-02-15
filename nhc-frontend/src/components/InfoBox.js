import '../css/InfoBox.css';

function InfoBox({title, stat, measure}) {
    return (
        <div className="InfoBox">
            <div className='title'>{title}</div>
            <div className=
                {'stats' + (measure?' w-measure':'')}>
                <div classname='stat'>
                    {stat}
                </div>
                {measure?<div className='measurement'>
                    {measure}
                </div>:''}
            </div>
        </div>
    );
}

export default InfoBox;
