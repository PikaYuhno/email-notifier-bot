export const styles = `
    .Mail {
        display: flex;
        flex-direction: column;
    }

    .header {
        margin-bottom: 1rem;
    }

    .time {
        font-size: .75rem;
        letter-spacing: .3px;
        color: #959ba7;
        display: block;
        line-height: 20px;
        margin: 0;
        left: 10%;
    }

    .to {
        font-family: Helvetica, Arial, sans-serif;
        font-size: .75rem;
        letter-spacing: .3px;
        color: #FFF4F3;
        line-height: 20px;
        margin: 0;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .from2 {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        -webkit-font-smoothing: auto;
        font-family: Helvetica, Arial, sans-serif;
        font-size: .75rem;
        letter-spacing: .3px;
        color: #959ba7;
        display: flex;
        max-width: -webkit-calc(100% - 8px);
        max-width: calc(100% - 8px);
        flex-direction: row;
        justify-content: space-between;
    }

    .from {
        font-family: Helvetica, Arial, sans-serif;
        font-size: .875rem;
        letter-spacing: .2px;
        color: #FFFFFF;
        font-weight: bold;
        white-space: nowrap;
        margin-right: 20px;
    }

    .subject {
        -webkit-font-smoothing: antialiased;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 1.375rem;
        font-variant-ligatures: no-contextual;
        color: #FFFFFF;
        font-weight: 400;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    * {
        color: #dcddde;
    }

    a {
        color: lightblue;
    }

    body {
        margin: 2rem;
    }

    hr {
        margin: 1rem;
    }
`;