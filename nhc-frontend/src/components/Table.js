import '../css/Table.css';

function Table({cols, rows}) {
    /**
     * Takes a list of columns and each row that will be displayed to the table
     * cols: array of column names
     *     ['col1', 'col2', 'col3']
     * rows: 2D array of data to be displayed
     *     [[1,2,3], [3,4,5]]
     */
    // Render each column
    let rendered_columns = cols.map(col=>{
        return (
            <th key={col}>{col}</th>
        );
    });

    // Render each row
    let rendered_rows = rows.map(row=>{
        return (
            <tr>
                {row.map(row_col=>{
                    return <td>{row_col}</td>
                })}
            </tr>
        )
    });

    // Return the finalized table

    return (
        <div className="Table">
            <table>
                <tr>{rendered_columns}</tr>
                {rendered_rows}
            </table>
        </div>
    );
}

export default Table;
