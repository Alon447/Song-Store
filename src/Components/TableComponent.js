import React, { useState } from "react";
import API from '../API/api'

import { Table, TableHead, TableRow, TableCell, TableSortLabel, Button, } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { millisecondsToMinutes, formatTotal, formatCell } from "../Components/Utilities";

import './TableComponent.css';

export default function TableComponent(props) {
  const { data, sortingOptions, handleSort, columns, buttons, onRowClick } = props;


  function renderButton(row) {
    return buttons.map((button, index) => {
      if (!row?.Deleted) {
        if (button.label === "Delete") {
          return (
            <TableCell key={`${row.id}-button-${button.label}`}>
              <Button
                variant="contained"
                color="error"
                onClick={() => button.onClick(row)}
                style={{ width: '100px' }}
              >
                {button.label}
              </Button>
            </TableCell>
          );
        } else {
          return (
            <TableCell key={`${row.id}-button-${button.label}`}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => button.onClick(row)}
                style={{ width: '100px' }}
              >
                {button.label}
              </Button>
            </TableCell>
          );
        }
      } else {
        return (
          <TableCell key={`${row.id}-deleted`}>
          </TableCell>
        );
      }
    })
  }

  return (
    <div className="tableContainer">
      <div className="tableMain">
        <Table>
          <TableHead>
            <TableRow className="tableHeader">
            <TableCell key="id">#</TableCell>
            {columns.map(column => (
              <TableCell key={column.id} align="left">
                <TableSortLabel
                active={sortingOptions.sortBy === column.id}
                direction={sortingOptions.sortOrder}
                onClick={() => handleSort(column.id)}
                >
                {column.label}
                </TableSortLabel>
              </TableCell>
              ))}
              <TableCell>Action</TableCell>

            </TableRow>
          </TableHead>
          <tbody>
            {data.map((row, index) => (
              <React.Fragment key={row.id}>
                <TableRow 
                  key={row.id} 
                  className={row.Deleted === 1 ? 'deleted-row' : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                <TableCell key={`${row.id}-index`}>{index+1}</TableCell>
                {columns.map(column => (
                  <TableCell key={`${row.id}-${column.id}`} className="table-cell">
                    {
                      formatCell(row, column.id)
                    }
                  </TableCell>
                  ))}
                  {renderButton(row)} 
                </TableRow>
              </React.Fragment>                
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );

}
