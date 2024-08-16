import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import API from '../API/api';
import { Button } from "@mui/material";
import "./Checkout.css"
import logo from "../song-search.png"

export default function Checkout() {
    const [checkoutDetails, setCheckoutDetails] = useState(null);
    const [items, setItems] = useState(null);
    

    useEffect(() => {
        getOrderDetails();
    }, []);

    async function getOrderDetails() {
        try {
            const response = await API.get('getcheckoutdetails');
            if (response.status === 200) {
                const checkoutData = response.data;
                console.log('Checkout Information:', checkoutData);
                setCheckoutDetails(checkoutData.invoice);
                setItems(checkoutData.items)
            }
        } catch (error) {
            console.error('Error fetching checkout details:', error);
        }
    }

    return (
        <div className="main">
            <div className="header">
                <h1>Thank You For Your Purchase!</h1>
                <Link to="/songSearch">
                    <img src={logo} alt="Song Search" className="logo"/>
                </Link>

            </div>
            {checkoutDetails && (
                <div className="checkout-details">
                    <h2>Order Details</h2>
                    <ul className="checkout-list">
                        <li className="checkout-listItem"><strong>Invoice ID:</strong> {checkoutDetails.InvoiceId}</li>
                        <li className="checkout-listItem"><strong>Customer ID:</strong> {checkoutDetails.CustomerId}</li>
                        <li className="checkout-listItem"><strong>Invoice Date:</strong> {checkoutDetails.InvoiceDate}</li>
                        <li className="checkout-listItem"><strong>Billing Address:</strong> {checkoutDetails.BillingAddress}</li>
                        <li className="checkout-listItem"><strong>Billing City:</strong> {checkoutDetails.BillingCity}</li>
                        <li className="checkout-listItem"><strong>Billing Country:</strong> {checkoutDetails.BillingCountry}</li>
                        <li className="checkout-listItem"><strong>Billing Postal Code:</strong> {checkoutDetails.BillingPostalCode}</li>
                        <li className="checkout-listItem"><strong>Total:</strong> ${checkoutDetails.Total.toFixed(2)}</li>
                    </ul>
                </div>
            )}
            {items && (
                <div className="song-list">
                    <h2>Songs Purchased</h2>
                    <ul>
                        {/* Map through items and display song details */}
                        {items.map((song) => (
                            <li key={song.TrackId}>
                                <strong>{song.Song_Name}</strong> by {song.Composer} - ${song.UnitPrice}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Link to="/songSearch">
                <Button variant="contained">Back to Browse Songs
                </Button>
            </Link>
        </div>
    );
}
