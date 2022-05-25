import styled from 'styled-components';
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";


export const ModalBackground  = styled.section`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.4);
`

export const ModalContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 32.5rem;
    height: 50rem;
    padding-bottom: 1rem;
    background: #fff;
    overflow: scroll;
    border-radius: 10px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 900;
    ::-webkit-scrollbar {
        display: none;
    }
`


export const Wrap = styled.div`
    display: flex;
    flex-direction : row-reverse;
    width : 100%;
    height : 5%;

    & > p{
        cursor: pointer;
        padding : 1.2rem 1.7rem;
        margin: 0 ;
        font-size : 1.4rem;
    }
`
export const RegisterWrap = styled.div`
    display: flex;
    justify-content : center;
    & > h2{
        font-size: 2rem;
        font-weight: 800;
        margin: 0;
    }
`

export const TitleWrap = styled.div`
    display: flex;
    width:100%;
    align-items : center;
    justify-content : center;
    flex-wrap: wrap;
    & > p{
        font-size : 1rem;
        font-weight : 700;
        padding : 1.5rem 0 0.3rem 0;
        margin: 0;
        width: 75%;
    }

    & > input {
        width : 73%;
        outline:none;
        height: 1.7rem;
        padding-left : 0.5rem;
        border: 1px solid #DFDFDF;
        border-radius: 4px;
        margin-bottom : 0.5rem;
        
    }
`

export const PhotoWrap = styled.div`
    width : 75%;
    height : auto;
    display:flex;
    justify-content : center;
    align-items : center;
    justify-content : space-between;

    & > p{
        margin: 1rem 0 0.5rem 0;
        font-size : 1rem;
        font-weight : 700;
    }

    & > label {
        cursor: pointer;
        margin: 1rem 0 0.5rem 0;
        font-size : 0.8rem;
        font-weight:500;
        overflow: hidden;
        border-radius: 4px;
        // border: 1px solid #DFDFDF;
        background-color : #F4F4F4;
        width : 4rem;
        height : 1.2rem;
        text-align: center;
        padding-top : 3px 

    }

    & > input{
        position: absolute;
        width: 0;
        height: 0;
        padding: 0;
        overflow: hidden;
        border: 0;
    }

`

export const PhotoSearch = styled.div`
    width : 75%;
    height : 10rem;
    border : 1px solid #DFDFDF;
    border-radius : 4px;
`

export const Photo = styled.div`
    width : 100%;
    height: 100%;

    img{
        border-radius: 4px;
        width : 100%;
        height: 100%;
    }

`


export const CategoryMemberWrap = styled.div`
    display: flex;
    padding-top : 1rem;
    width: 75%;
    justify-content : space-between;
`

export const Category = styled.select`
    width: 11rem;
    height: 1.9rem;
    border : 1px solid #DFDFDF;
    border-radius : 4px;
    outline:none;
`

export const AtLeastMember = styled.div`
    
    
    & > input {
        outline:none;
        padding-left: 0.5rem;
        width : 10.5rem;
        height: 1.7rem;
        border : 1px solid #DFDFDF;
        border-radius : 4px;
        ::-webkit-outer-spin-button,
        ::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
        
        }
    }
`

export const ContentWrap = styled.div`
    width : 75%;
    padding-top: 0.5rem;
    font-size : 1rem;
    font-weight : 700;
    & > p {
        margin-bottom: 0.5rem;
    }
`

export const Content = styled.div`
    display: flex;
    justify-content : center;
    width : 100%;
    
    & > textarea{
        width: 100%;
        height : 6rem;
        border : 1px solid #DFDFDF;
        border-radius : 4px;
        outline:none;
        resize: none;
    }

   
`

export const DateWrap = styled.div`
    width : 75%;
    display: flex;
    flex-direction :column;
    margin: 1rem 0 0 0 ;

    & > p{
        width: 100%;
        margin : 0 0 0.5rem 0;
        font-size : 1rem;
        font-weight : 700;
    }
`

export const EndDate = styled(DatePicker)`
    width : 98.5%;
    height: 1.7rem;
    font-size: 0.9rem;
    text-align: center;
    border: 1px solid #DFDFDF;
    border-radius : 4px;
    outline: none;
    cursor: pointer;
`

export const PostLocationWrap = styled.div`
    display : flex;
    flex-direction : column;
    width : 75%;

    & > p{
        margin : 1rem 0 0.5rem 0;
        font-size : 1rem;
        font-weight : 700;
    }
`

export const PostLocation = styled.div`
    width : 100%;
    display : flex;
    justify-content : center;
    align-items : center;
    
    & > input {
        width: 80%;
        height : 1.7rem;
        //margin-right:1rem ;
        border: 1px solid #DFDFDF;
        border-radius : 4px;
        outline:none;
    }

    
`

export const LocationButtonWrap = styled.div`
    width : 20%;
    padding-left : 1rem;
    

    & > button {
        width : 100%;
        height : 1.95rem;
        padding : 0;
        border: none;
        background-color : #F4F4F4;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight : 700;
        cursor: pointer;
    }
`


export const RegisterButtonWrap = styled.div`
    
    display : flex;
    justify-content : center;
    width : 75%;
    padding-top: 1rem;

    & > button {
        width : 100%;
        height: 2.5rem;
        border : none;
        background-color: #FF6767 ;
        color : white;
        border-radius: 4px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
    }
`