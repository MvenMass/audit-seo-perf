      url3 === undefined ||
      url4 === undefined ||
      cityId === undefined ||
      cityCode === undefined ||
      url5 === undefined
    ) {
      return res.status(400).json({
        error: 'Missing parameters. Required: url1, url2, url3, url4, url5'
      });
    }
    let generatedUrl =  await runAutomation(cityCode, cityId, url1, url2, url3, url4, url5);
    res.status(200).json(generatedUrl);



  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({error });
  }
});

httpServer.listen(8080);
httpsServer.listen(3000);