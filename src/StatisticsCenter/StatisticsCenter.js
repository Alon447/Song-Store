import React, {useState, useEffect, useRef} from "react";
import { Link, useNavigate } from 'react-router-dom';
import Header from "../Components/Header";
import API from '../API/api'
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import CircularProgress from '@mui/material/CircularProgress';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Navbar from "../Components/Navbar";
import { navbarButtons } from "../Components/Utilities";

import './StatisticsCenter.css'
export default function StatisticsCenter(){

    const [user, setUser] = useState(null)
    const [cart, setCart] = useState(null)
    const nav = useNavigate()

    // first graph
    const [genreNames, setGenreNames] = useState([]);
    const [genreSales, setGenreSales] = useState([]);
    // second graph
    const [salesmanNames, setSalesmanNames] = useState([]);
    const [salesmanSales, setSalesmanSales] = useState([]);
    // third graph
    const [topSongs, setTopSongs] = useState([]);
    const [itemNb, setItemNb] = React.useState(5);

    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        fetchUserData()
        fetchSalesByGenre()
        fetchSalesBySalesman()
        fetchBestSellingSongs()
    }, []);
    
    useEffect(() => {
        fetchBestSellingSongs()
    }, [itemNb]);
    
    async function fetchSalesByGenre(){
        try{
            const responseGenre = await API.get('sales-by-genre');
            const genreNames = responseGenre.data.map((item) => item.genre_name);
            const sales = responseGenre.data.map((item) => item.sales_count);
            setGenreNames(genreNames);
            setGenreSales(sales);
        }
        catch (error) {
            console.error('Error fetching track purchase statistics:', error);
            nav("/songsearch")
        }
    }

    async function fetchSalesBySalesman(){
        try{
            const responseSalesman = await API.get('sales-by-salesman');
            const staffNames = responseSalesman.data.map((item) => `${item.first_name} ${item.last_name}`);
            const numberOfSales = responseSalesman.data.map((item) => item.total_sales);
            setSalesmanNames(staffNames);
            setSalesmanSales(numberOfSales);
        }
        catch (error) {
            console.error('Error fetching track purchase statistics:', error);
            nav("/songsearch")
        }
    }
    
    async function fetchBestSellingSongs(){
        try{
            const responseTopSongs = await API.get('best-selling-songs', {
                params: { item: itemNb }
            });            
            const formattedTopSongs = responseTopSongs.data.map((song) => ({
                name: song.Song_Name,
                sales: song.TotalSales,
            }));
            setTopSongs(formattedTopSongs);
            setIsLoading(false);
        }
        catch (error) {
            console.error('Error fetching track purchase statistics:', error);
            nav("/songsearch")
        }
    }
    
    async function fetchUserData(){
        try {
            const managerResponse = await API.get('managerinfo');
            // console.log('managerinfo')
            setUser(managerResponse.data)
            const resCart = await API.get('cartdata', {});
              if (resCart.status === 200) {
                  const cartData = resCart.data;
                  setCart(cartData.cart_track_count)
              }
              else{
                  sessionStorage.removeItem('token');
                  nav("/")
                  console.error('Failed to fetch user information');
              }
        } catch (error) {
            console.error('Error fetching track purchase statistics:', error);
            nav("/songsearch")
        }
    }
    
    const handleItemNbChange = (event, newValue) => {
        if (typeof newValue !== 'number') {
          return;
        }
        setItemNb(newValue);
    };
    
    return(
        <div className='statistics-center'>
            <Navbar
                user={user}
                navbarButtons={navbarButtons}
                cart={cart}
            />
            <div className='statistics-center-data'>
                <div className='sales-by-genre'>
                        <h2>Sales By Genre</h2>
                        {isLoading ? (
                            <CircularProgress/>
                            ) : (
                                <div>
                                    <BarChart
                                        width={1400}
                                        height={400}
                                        series={[{ data: genreSales, label: 'sales', type: 'bar' }]}
                                        xAxis={[{ scaleType: 'band', data: genreNames, categoryGapRatio: 0.3}]}
                                    />
                                    <h2>Sales By Salesman</h2>
                                    <PieChart
                                        series={[
                                            {
                                                data: salesmanSales.map((value, index) => ({
                                                    id: index,
                                                    value,
                                                    label: salesmanNames[index],
                                                })),
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                            },
                                        ]}
                                         height={400}
                                    />
                                    <h2>Top 10 Selling Songs</h2>
                                    <Typography id="input-item-number" gutterBottom>
                                            Number of items
                                        </Typography>
                                        <Slider
                                            value={itemNb}
                                            onChange={handleItemNbChange}
                                            valueLabelDisplay="auto"
                                            min={1}
                                            max={20}
                                            aria-labelledby="input-item-number"
                                        />
                                    <BarChart
                                        width={1400}
                                        height={400}
                                        series={[{ data: topSongs.map(song => song.sales), xAccessor: 'name', yAccessor: 'sales', type: 'bar' }]}
                                        xAxis={[{ scaleType: 'band', data: topSongs.map(song => song.name), categoryGapRatio: 0.3 }]}
                                    />
                                </div>
                        )}
                </div>
            </div>
                
        </div> 
    )
}
