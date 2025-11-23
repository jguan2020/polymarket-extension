
const featuredApi = "https://gamma-api.polymarket.com/markets";  //landing page data
const searchApi = "https://gamma-api.polymarket.com/public-search";  //search data
const awsLambda = "https://4rlb5xh5osnoeuv6usqeo5qsqa0qpjhn.lambda-url.us-east-1.on.aws/";  //load db data


/**
 * Init global document variables
 */
const root = document.getElementById('root'); 
root.className = 'root';
const dash = document.createElement('div');
dash.className = 'dash';
const loading = document.createElement('div');
loading.className = 'loading';
root.appendChild(dash);
createDash();
const grid = document.createElement('div');
grid.className='grid';
root.appendChild(grid);

const pages = document.createElement('div');
pages.className = 'pages';

root.appendChild(pages);

let featured = [];

/**
 * Hits the search API and applies data filters to the response
 * @param {string} query 
 * @returns {Array} markets array
 */
async function searchFunc(query){
    const searchUrl = new URL(searchApi);
    searchUrl.searchParams.set("q",query);
    searchUrl.searchParams.set("page","1");
    searchUrl.searchParams.set("limit_per_type","90");
    searchUrl.searchParams.set("type","events");
    searchUrl.searchParams.set("events_status","active");
    searchUrl.searchParams.set("sort","volume_24hr");
    searchUrl.searchParams.append("presets","EventsTitle");
    searchUrl.searchParams.append("presets","Events");
    const res = await fetch(searchUrl.toString());
    if(!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    const events = Array.isArray(data.events) ? data.events : [];
    const markets = events.flatMap((event)=>event.markets ?? []).filter((market) => Number(market.liquidityNum) > 0);;
    return markets.slice(0,90);
}

/**
 * Updates data on each page
 */
function updatePages(){
    const pageCount = Math.ceil(getActiveMarkets().length / 9);
    let currPage = 0;
    pages.replaceChildren();
    for(let i=0;i<pageCount;i++){
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i+1;
        if(i===currPage){
            pageBtn.classList.add('active');
        }

        pageBtn.addEventListener('click', ()=>{
            currPage = i;
            renderPage(i);
            updateActive(i);
        });
        pages.appendChild(pageBtn);
    }

}

/**
 * Creates dashboard of popup
 */
function createDash(){
    const searchItems = document.createElement('div');
    searchItems.className = 'searchItems';
    const search = document.createElement('div');
    search.className = 'search';
    const textbox = document.createElement('input');
    textbox.className = 'textbox';
    textbox.type = 'text';
    textbox.placeholder = 'Search for a bet';
    const submit = document.createElement('input');
    submit.type = 'button';
    submit.value = "Search";
    submit.className = 'submit';
    submit.addEventListener('click', async ()=>{
        if(!textbox) return;
        try{
            loading.textContent = 'Loading...';
            featured = await searchFunc(textbox.value.trim());
            renderPage(0);
            updatePages();
        }
        catch(e){
            
        }
        finally{
            loading.textContent = '';
        }
    });

    searchItems.appendChild(textbox);
    searchItems.appendChild(submit);
    search.appendChild(searchItems);
    search.appendChild(loading);
    dash.appendChild(search);
}

/**
 * Creates img element of the cell
 * @param {Object} item 
 * @returns {HTMLImageElement}
 */
function createImg(item){
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = 'Image not available';
    img.className = 'item-img';
    return img;
}

/**
 * Creates odd split element of the cell
 * @param {Object} item 
 * @returns {HTMLDivElement}
 */
function createOdds(item){
    const text = document.createElement('div');
    const raw = item.outcomePrices;
    let prices = [];
    try{
        prices = JSON.parse(raw);
    }
    catch{
        prices = [];
    }
    const yes = document.createElement('div');
    yes.className = 'yes';
    yes.textContent = JSON.parse(item.outcomes || '[]')[0];
    const no = document.createElement('div');
    no.className = 'no';
    no.textContent = JSON.parse(item.outcomes || '[]')[1];
    const yesNum = document.createElement('div');
    yesNum.className = 'yesNum';
    yesNum.textContent = `${(prices[0]*100).toFixed(2)}%`;const noNum = document.createElement('div');
    noNum.className = 'noNum';
    noNum.textContent = `${(prices[1]*100).toFixed(2)}%`;

    const yesFull = document.createElement('div');
    yesFull.className='yesFull';
    yesFull.appendChild(yes);
    yesFull.appendChild(yesNum);

    const noFull = document.createElement('div');
    noFull.className='noFull';
    noFull.appendChild(no);
    noFull.appendChild(noNum);

    text.appendChild(yesFull);
    text.appendChild(noFull);

    text.className = 'text';
    return text;
}

/**
 * Creates stake element of the cell
 * @param {Object} item 
 * @returns {HTMLDivElement}
 */
function createPot(item){
    const pot = document.createElement('div');
    pot.className = 'pot';
    let strStake = `${item.liquidityNum.toFixed(2)}`;
    let newStr = '';
    let i=6;
    newStr=strStake.substring(strStake.length-i,strStake.length);
    for(i=6;i<strStake.length;i+=3){
        if(strStake.length-i-3<0){
            newStr = strStake.substring(0,strStake.length-i) + ',' + newStr;
        }
        else{
            newStr=strStake.substring(strStake.length-i-3,strStake.length-i) + ',' + newStr;
        }
    }
    pot.textContent = `Total Stake: $${newStr}`;
    return pot;
}

/**
 * Creates question element of the cell
 * @param {Object} item 
 * @returns {HTMLDivElement}
 */
function createQuestion(item){
    const question = document.createElement('div');
    question.className = 'question';
    question.textContent = item.question;
    return question;
}

/**
 * Creates cell element
 * @param {Object} item 
 * @returns {HTMLDivElement}
 */
function createCell(item){
    const cell = document.createElement('div');
    cell.className = 'cell';
    const row1 = document.createElement('div');
    row1.className = 'row1';
    row1.appendChild(createImg(item));
    row1.appendChild(createOdds(item));
    cell.appendChild(row1);
    const row2 = document.createElement('div');
    row2.className = 'row2';
    row2.appendChild(createQuestion(item));
    cell.appendChild(row2);
    cell.appendChild(createPot(item));
    return cell;
}
/**
 * Renders each page
 * @param {number} index 
 */
function renderPage(index){
    grid.replaceChildren();
    const items = getActiveMarkets().slice(index*9,(index+1)*9);
    items.forEach((item)=>{
        grid.appendChild(createCell(item));
    });
}

/**
 * Updates the active page number tag
 * @param {number} index 
 */
function updateActive(index){
    for(let i=0;i<pages.children.length;i++){
        if(i==index) pages.children[i].classList.add('active');
        else pages.children[i].classList.remove('active');
    }
}

/**
 * Returns Array of filtered response data
 * @returns {Array}
 */
function getActiveMarkets(){
    const groups = new Map();
    featured.forEach((market) => {
        if (Number(market.liquidityNum) <= 0) return;
        const key = market.events?.[0]?.slug ||
            market.questionID ||
            market.conditionId ||
            market.slug;

        if(!key) return;

        const existing = groups.get(key);
        if (!existing || Number(market.liquidityNum) > Number(existing.liquidityNum)) {
            groups.set(key, market); 
        }
    });
    return Array.from(groups.values());
}

/**
 * Hits the featured API and renders the popup
 */
async function loadFeatured() {

    try{
        const featuredUrl = new URL(featuredApi);
        featuredUrl.searchParams.set("limit","200");
        featuredUrl.searchParams.set("active","true");
        featuredUrl.searchParams.set("closed","false");
        featuredUrl.searchParams.set("order","volume24hr");
        featuredUrl.searchParams.set("ascending","false");
        featuredUrl.searchParams.set("presets","NewMarkets");
        loading.textContent = 'Loading...';
        const res = await fetch(featuredUrl.toString());
        const data = await res.json();
        const markets = data.filter((market) => Number(market.liquidityNum) > 0);
        
        featured = markets;
        renderPage(0);
        updatePages();
    }
    catch(e){

    }
    finally{
        loading.textContent = '';
    }

}

loadFeatured();